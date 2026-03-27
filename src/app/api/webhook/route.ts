import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { thread_id, content, secret } = body;

    if (secret !== process.env.CRM_CHAT_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!thread_id || !content) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const supabase = await createClient();

    await supabase
      .from("chat_messages")
      .insert({
        thread_id,
        sender_type: "bot",
        content
      });

    await supabase
      .from("chat_threads")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_count: 0
      })
      .eq("id", thread_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
