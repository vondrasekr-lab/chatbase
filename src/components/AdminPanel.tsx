"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { createClient } from "@/utils/supabase/client";
import { getChatThreads, getChatMessagesById, adminSendChatMessage } from "@/app/actions/chat";
import { Send, User, MessageSquare, Clock, Search, Loader2, LogOut } from "lucide-react";

export default function AdminPanel() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
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
    setThreads(data);
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, []);

  useEffect(() => {
    if (!selectedThread) return;
    const fetchMessages = async () => {
      const { messages: data } = await getChatMessagesById(selectedThread.id);
      setMessages(data);
    };
    fetchMessages();
  }, [selectedThread]);

  useEffect(() => {
    const threadChannel = supabase
      .channel("crm_threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_threads" }, () => fetchThreads())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
           fetchThreads();
           if (payload.new.sender_type === 'user') {
              playNotificationSound();
              showSystemNotification("Nová zpráva", payload.new.content);
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

  if (loading) return <div className="p-20 text-center font-bold text-primary italic">Načítám...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] bg-white border-t border-slate-100 overflow-hidden">
      {/* Sidebar a detail konverzace - zkráceno pro přehlednost */}
      <div className={`w-full lg:w-80 border-r border-slate-100 flex flex-col bg-slate-50/10 shrink-0 ${selectedThread ? 'hidden lg:flex' : 'flex'}`}>
         {/* Seznam konverzací (Threads) */}
         <div className="p-6 border-b border-slate-100">
            <h2 className="font-black text-slate-900 mb-4 uppercase tracking-wider text-xs">Konverzace</h2>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input type="text" placeholder="Hledat..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-primary" />
            </div>
         </div>
         <div className="flex-grow overflow-y-auto">
            {threads.map(t => (
               <button key={t.id} onClick={() => setSelectedThread(t)} className={`w-full p-5 flex gap-4 text-left border-b border-slate-50 hover:bg-white ${selectedThread?.id === t.id ? 'bg-white border-l-4 border-l-primary shadow-sm' : ''}`}>
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${t.unread_count > 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <User size={24} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="font-black text-slate-900 text-sm truncate block">{t.full_name || t.email}</span>
                    <p className="text-xs text-slate-500 truncate">{t.last_message}</p>
                  </div>
               </button>
            ))}
         </div>
      </div>

      <div className="flex-grow flex flex-col bg-white overflow-hidden">
        {selectedThread ? (
          <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/5 shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight italic">{selectedThread.full_name || "Klient"}</h3>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{selectedThread.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                       <span className="text-[10px] font-black uppercase text-slate-400 italic">Přihlášen jako</span>
                       <span className="text-[11px] font-black text-primary">{user?.email}</span>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                      title="Odhlásit se"
                    >
                      <LogOut size={20} />
                    </button>
                    <button onClick={() => setSelectedThread(null)} className="lg:hidden text-slate-400">Zpět</button>
                 </div>
              </div>
            <div className="flex-grow p-8 overflow-y-auto space-y-6">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-sm font-bold shadow-sm ${m.sender_type === 'admin' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-50 text-slate-900 rounded-bl-none border border-slate-100'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-6 border-t border-slate-100 bg-white shadow-lg shadow-slate-200">
               <form onSubmit={handleSend} className="flex gap-4">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Napište zprávu..." className="flex-grow bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-primary focus:bg-white" disabled={isPending} />
                  <button type="submit" className="h-14 w-14 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50 transition-all">
                    <Send size={24} />
                  </button>
               </form>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center grayscale opacity-20">
             <MessageSquare size={64} className="text-slate-400 mb-6" />
             <h3 className="text-xl font-black text-slate-900 italic">Vyberte konverzaci</h3>
          </div>
        )}
      </div>
    </div>
  );
}
