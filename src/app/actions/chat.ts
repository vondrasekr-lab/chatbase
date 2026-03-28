"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

async function getGeoLocation(ip: string) {
  if (!ip || ip === "unknown" || ip.includes("127.0.0.1") || ip.includes("::1")) {
    return null;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city`, {
      signal: controller.signal
    });
    const data = await res.json();
    clearTimeout(timeoutId);

    if (data.status === "success") {
      return {
        city: data.city,
        country: data.country,
        countryCode: data.countryCode
      };
    }
  } catch (e: any) {
    // Silent fail for geo
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

export async function sendChatMessage(data: { 
  name: string, 
  email: string, 
  message: string, 
  userId?: string, 
  page: string,
  siteId?: string,
  userAgent?: string 
}) {
  const supabase = await createClient();
  const headerList = await headers();
  
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(',')[0].trim() : (headerList.get("x-real-ip") || "unknown");
  const ua = data.userAgent || headerList.get("user-agent") || "unknown";

  const geo = await getGeoLocation(ip);
  
  let finalThreadId: string;
  let ownerId: string | null = null;

  // 1. Zjistit majitele podle Site ID
  if (data.siteId) {
    const { data: site } = await supabase
      .from("chat_sites")
      .select("owner_id")
      .eq("id", data.siteId)
      .single();
    
    if (site) {
      ownerId = site.owner_id;
    }
  }

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("email", data.email)
    .single();

  if (!thread) {
    const { data: newThread, error: threadError } = await supabase
      .from("chat_threads")
      .insert({
        full_name: data.name,
        email: data.email,
        user_id: data.userId || null,
        owner_id: ownerId, // PŘIŘAZENÍ MAJITELE
        site_id: data.siteId || null,
        ip_address: ip,
        user_agent: ua,
        metadata: {
           page_source: data.page,
           last_ip: ip,
           created_at: new Date().toISOString(),
           city: geo?.city,
           country: geo?.country,
           countryCode: geo?.countryCode
        }
      })
      .select()
      .single();

    if (threadError || !newThread) throw new Error("Chyba při zakládání chatu");
    finalThreadId = newThread.id;
  } else {
    finalThreadId = thread.id;
    await supabase
      .from("chat_threads")
      .update({
        ip_address: ip,
        user_agent: ua,
        metadata: {
          last_ip: ip,
          last_page: data.page,
          updated_at: new Date().toISOString(),
          city: geo?.city,
          country: geo?.country,
          countryCode: geo?.countryCode
        }
      })
      .eq("id", finalThreadId);
  }

  await supabase
    .from("chat_messages")
    .insert({
      thread_id: finalThreadId,
      sender_type: "user",
      content: data.message
    });

  await supabase
    .from("chat_threads")
    .update({ 
      last_message: data.message, 
      last_message_at: new Date().toISOString(),
      unread_count: 1 
    })
    .eq("id", finalThreadId);

  // n8n Webhook call
  if (process.env.N8N_CHAT_WEBHOOK_URL) {
    fetch(process.env.N8N_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            thread_id: finalThreadId,
            content: data.message,
            user_name: data.name,
            user_email: data.email,
            page_url: data.page,
            metadata: {
                city: geo?.city,
                country: geo?.country,
                userAgent: ua
            }
        })
    }).catch(e => console.error("[Chat] n8n Webhook Error:", e.message));
  }

  return { success: true, threadId: finalThreadId };
}

export async function adminSendChatMessage(threadId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Neste přihlášen" };

  // Ověřit vlastnictví threadu
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("owner_id")
    .eq("id", threadId)
    .single();

  if (!thread || thread.owner_id !== user.id) {
    return { success: false, error: "Nemáte oprávnění k tomuto chatu" };
  }

  const { error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      sender_type: "admin",
      content: content
    });

  if (error) return { success: false, error: error.message };

  await supabase
    .from("chat_threads")
    .update({ 
      last_message: content, 
      last_message_at: new Date().toISOString(),
      unread_count: 0 
    })
    .eq("id", threadId);

  return { success: true };
}

export async function getChatThreads() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { threads: [] };

  const { data } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("owner_id", user.id) // FILTRACE DLE VLASTNÍKA
    .order("last_message_at", { ascending: false });

  return { threads: data || [] };
}

export async function getChatMessagesById(threadId: string) {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return { messages: messages || [] };
}

export async function getOrCreateSite() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { site: null };

  const { data: existingSite } = await supabase
    .from("chat_sites")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingSite) return { site: existingSite };

  const { data: newSite, error } = await supabase
    .from("chat_sites")
    .insert({
      owner_id: user.id,
      name: "Default Site",
      domain: ""
    })
    .select()
    .single();

  if (error) {
    console.error("[Chat] Site Error:", error.message);
    return { site: null };
  }

  return { site: newSite };
}
