"use client";

import * as React from "react";
import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { getChatThreads, getChatMessagesById, adminSendChatMessage, getOrCreateSite } from "@/app/actions/chat";
import { Send, User, MessageSquare, Clock, Search, LogOut, Settings, Copy, Check, LayoutDashboard } from "lucide-react";

export default function AdminPanel() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [site, setSite] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: userData } } = await supabase.auth.getUser();
      setUser(userData);
    };
    fetchUser();
  }, [supabase]);

  const showSystemNotification = (title: string, body: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  };

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + start + duration);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      playTone(880, 0, 0.3); // A5
      playTone(1320, 0.15, 0.3); // E6
    } catch (e) { console.error(e); }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchThreads = async () => {
    const { threads: data } = await getChatThreads();
    setThreads(data || []);
    setLoading(false);
  };

  useEffect(() => { 
    fetchThreads();
    const fetchSite = async () => {
      const { site: siteData } = await getOrCreateSite();
      setSite(siteData);
    };
    fetchSite();
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    const fetchMessages = async () => {
      const { messages: data } = await getChatMessagesById(selectedThread.id);
      setMessages(data || []);
    };
    fetchMessages();
  }, [selectedThread]);

  useEffect(() => {
    const threadChannel = supabase
      .channel("crm_threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_threads" }, () => fetchThreads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload: any) => {
           fetchThreads();
           if (payload.new && payload.new.sender_type === 'user') {
              playNotificationSound();
              showSystemNotification("Nová zpráva", payload.new.content || "");
           }
      })
      .subscribe();

    return () => { supabase.removeChannel(threadChannel); };
  }, [supabase]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedThread) return;
    const content = input;
    setInput("");
    startTransition(async () => {
      await adminSendChatMessage(selectedThread.id, content);
    });
  };

  if (loading) return <div className="p-20 text-center font-bold text-sky-600 italic">Načítám...</div>;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden w-full">
      {/* 1. Permanent Navigation sidebar */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 shrink-0 border-r border-slate-800 shadow-2xl z-20">
         <div className="h-12 w-12 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <LayoutDashboard size={24} />
         </div>

         <div className="flex flex-col gap-3 flex-grow w-full px-2">
            <button 
               onClick={() => { setShowSettings(false); setSelectedThread(null); }}
               className={`h-14 w-full flex items-center justify-center rounded-2xl transition-all ${!showSettings ? 'bg-sky-600/20 text-sky-400' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
               title="Můj Inbox"
            >
               <MessageSquare size={24} />
            </button>
            <button 
               onClick={() => { setShowSettings(true); setSelectedThread(null); }}
               className={`h-14 w-full flex items-center justify-center rounded-2xl transition-all ${showSettings ? 'bg-sky-600/20 text-sky-400' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
               title="Nastavení webu"
            >
               <Settings size={24} />
            </button>
         </div>

         <button 
           onClick={handleLogout}
           className="h-14 w-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded-2xl transition-all"
           title="Odhlásit se"
         >
           <LogOut size={24} />
         </button>
      </div>

      {/* 2. Sub-Sidebar (Threads) */}
      {!showSettings && (
         <div className={`w-full lg:w-80 border-r border-slate-100 flex flex-col bg-slate-50/10 shrink-0 ${selectedThread ? 'hidden lg:flex' : 'flex'} z-10 shadow-sm`}>
            <div className="p-6 border-b border-slate-100">
               <h2 className="font-black text-slate-900 mb-4 uppercase tracking-wider text-[10px]">Konverzace</h2>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Hledat..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-sky-600" />
               </div>
            </div>
            <div className="flex-grow overflow-y-auto">
               {threads.length === 0 ? (
                 <div className="p-10 text-center space-y-3 opacity-40">
                   <Clock size={32} className="mx-auto text-slate-400" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">Zatím nic</p>
                 </div>
               ) : (
                 threads.map((t: any) => (
                   <button 
                     key={t.id} 
                     onClick={() => { setSelectedThread(t); setShowSettings(false); }} 
                     className={`w-full p-5 flex gap-4 text-left border-b border-slate-50 hover:bg-white transition-all ${selectedThread?.id === t.id ? 'bg-white border-l-4 border-l-sky-600 shadow-sm' : ''}`}
                   >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${t.unread_count > 0 ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <User size={20} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <span className="font-black text-slate-900 text-xs truncate block">{t.full_name || t.email}</span>
                        <p className="text-[10px] text-slate-400 truncate font-bold">{t.last_message}</p>
                      </div>
                   </button>
                 ))
               )}
            </div>
         </div>
      )}

      {/* 3. Main content area */}
      <div className="flex-grow flex flex-col bg-white overflow-hidden relative">
        {(selectedThread || showSettings) ? (
          <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/5 shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center lg:hidden">
                       {showSettings ? <Settings size={20} /> : <MessageSquare size={20} />}
                     </div>
                     <div>
                       <h3 className="font-black text-slate-900 text-base leading-tight italic decoration-sky-600 underline">
                         {showSettings ? "Nastavení webu" : (selectedThread?.full_name || "Klient")}
                       </h3>
                       <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                         {showSettings ? "Administrace CRM-CHAT" : selectedThread?.email}
                       </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 italic">Administrátor</span>
                        <span className="text-[10px] font-black text-sky-600 truncate max-w-[150px]">{user?.email}</span>
                     </div>
                     <button onClick={() => { setSelectedThread(null); setShowSettings(false); }} className="lg:hidden text-sky-600 font-black text-[10px] uppercase underline">Zavřít</button>
                  </div>
              </div>

              <div className="flex-grow overflow-hidden flex flex-col">
                {showSettings ? (
                  <div className="flex-grow p-10 lg:p-16 overflow-y-auto bg-slate-50/30">
                    <div className="max-w-2xl mx-auto space-y-12">
                      <div className="space-y-4 text-center">
                        <h4 className="text-4xl font-black text-slate-900 italic tracking-tighter">Instalace Chatu</h4>
                        <p className="text-slate-500 font-bold leading-relaxed text-sm max-w-sm mx-auto">
                          Tento kód zkopírujte a vložte do svého webu. Propojí ho s tímto Inboxem.
                        </p>
                      </div>

                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 h-32 w-32 bg-sky-600/5 blur-[60px] rounded-full -mr-10 -mt-10" />
                        <div className="space-y-3 relative">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Tvůj privátní Site ID</label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                              readOnly 
                              value={site?.id || "Generuji..."} 
                              className="flex-grow bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-base font-black text-sky-600 font-mono shadow-inner outline-none text-center sm:text-left"
                            />
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(site?.id || "");
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="px-8 py-4 bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                              {copied ? <Check size={18} /> : <Copy size={18} />}
                              {copied ? "Máš to!" : "Kopírovat ID"}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 relative">
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">URL Widgetu pro iFrame</label>
                           <div className="bg-slate-900 p-8 rounded-[2rem] relative overflow-hidden border border-slate-800 shadow-2xl">
                              <code className="text-[12px] text-sky-400 font-mono leading-relaxed block overflow-x-auto whitespace-pre-wrap">
                                {`https://chatbase.cz/widget?siteId=${site?.id}`}
                              </code>
                           </div>
                        </div>
                      </div>

                      <div className="bg-sky-600/5 p-8 rounded-[2.5rem] border border-sky-600/10 flex gap-6 items-start">
                         <div className="h-10 w-10 bg-sky-600 text-white rounded-xl flex items-center justify-center shrink-0">
                            <Clock size={20} />
                         </div>
                         <div className="space-y-2">
                            <h5 className="font-black text-slate-900 italic text-sm underline decoration-sky-600 underline-offset-4">Jak to otestovat hned?</h5>
                            <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                              Otevřete si odkaz výše v novém anonymním okně. Napište tam první zprávu. 
                              Jakmile ji odešlete, tato administrace vám cinkne a zpráva naskočí v Inboxu.
                            </p>
                         </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-slate-50/30">
                      {messages.map((m: any) => (
                        <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 lg:p-5 rounded-[2.2rem] text-[13px] font-black leading-relaxed shadow-sm ${m.sender_type === 'admin' ? 'bg-sky-600 text-white rounded-br-none shadow-sky-600/20' : 'bg-white text-slate-900 rounded-bl-none border border-slate-200/40 shadow-slate-200'}`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-6 border-t border-slate-100 bg-white">
                       <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
                          <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Zde napište svou odpověď..." 
                            className="flex-grow bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-black outline-none focus:border-sky-600 focus:bg-white transition-all shadow-inner" 
                            disabled={isPending} 
                          />
                          <button 
                            type="submit" 
                            className="h-16 w-16 bg-sky-600 text-white rounded-3xl flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-50 shadow-2xl shadow-sky-600/30 transition-all hover:rotate-6"
                            disabled={isPending || !input.trim()}
                          >
                            <Send size={28} />
                          </button>
                       </form>
                    </div>
                  </>
                )}
              </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-10 bg-slate-50/5 relative">
             <div className="absolute inset-0 bg-sky-200/5 blur-[120px] rounded-full animate-pulse" />
             <div className="relative">
                <div className="absolute inset-0 bg-sky-400/20 blur-[60px] rounded-full scale-[2]" />
                <div className="relative h-32 w-32 bg-white rounded-[3.5rem] flex items-center justify-center shadow-2xl shadow-slate-200 border border-slate-50">
                  <MessageSquare size={56} className="text-sky-600" />
                </div>
             </div>
             <div className="max-w-xs space-y-4 relative">
                <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">Váš Inbox<br/>je aktivní</h3>
                <p className="text-slate-400 text-[10px] font-black leading-relaxed uppercase tracking-widest px-6 opacity-70">
                  Klikněte na ozubené kolečko vlevo pro nastavení vašeho Site ID a připojení webu
                </p>
             </div>
             <button 
               onClick={() => setShowSettings(true)}
               className="px-12 py-5 bg-sky-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(2,132,199,0.3)]"
             >
               Otevřít Nastavení
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
