"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { MessageCircle, X, Send, Loader2, MessageSquare, UserPlus, ArrowRight, Mail, User, LogOut, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { sendChatMessage } from "@/app/actions/chat";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [chatName, setChatName] = useState<string>("");
  const [chatEmail, setChatEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(isOpen ? 'chat-open' : 'chat-close', '*');
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedThreadId = localStorage.getItem("crm_chat_thread_id");
      const savedName = localStorage.getItem("crm_chat_name");
      const savedEmail = localStorage.getItem("crm_chat_email");
      if (savedThreadId) setThreadId(savedThreadId);
      if (savedName) { setChatName(savedName); setName(savedName); }
      if (savedEmail) { setChatEmail(savedEmail); setEmail(savedEmail); }
    }
  }, []);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`chat_${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${threadId}` }, (p) => {
          setChatMessages(prev => [...prev.filter(m => m.id !== p.new.id), p.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, supabase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    startTransition(async () => {
      const currentMsg = message;
      setMessage("");
      const result = await sendChatMessage({
        name: chatName || name,
        email: chatEmail || email,
        message: currentMsg,
        page: window.location.pathname,
        userAgent: navigator.userAgent
      });

      if (result.success && result.threadId) {
        setThreadId(result.threadId);
        localStorage.setItem("crm_chat_thread_id", result.threadId);
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-4 w-[380px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-120px)] bg-white shadow-2xl rounded-[32px] overflow-hidden flex flex-col border border-slate-100 italic">
          <div className="bg-primary p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} />
              <div>
                <h4 className="font-black text-sm uppercase">Podpora</h4>
                <span className="text-[10px] opacity-70">Jsme online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
            {chatMessages.length === 0 && !chatName ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center">
                 <UserPlus size={40} className="text-primary mb-4" />
                 <h5 className="font-black text-slate-900 mb-2">Můžeme se seznámit?</h5>
                 <input type="text" placeholder="Jméno" value={name} onChange={e => setName(e.target.value)} className="w-full mb-2 p-4 rounded-2xl border" />
                 <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mb-4 p-4 rounded-2xl border" />
                 <button onClick={() => { setChatName(name); setChatEmail(email); localStorage.setItem("crm_chat_name", name); localStorage.setItem("crm_chat_email", email); }} className="w-full bg-primary text-white py-4 rounded-2xl font-black">Začít</button>
              </div>
            ) : (
              chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold ${m.sender_type === 'user' ? 'bg-primary text-white' : 'bg-white text-slate-900 border'}`}>
                    {m.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            {chatName && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Zpráva..." className="flex-grow p-4 bg-slate-50 rounded-2xl outline-none" />
                <button type="submit" className="bg-primary text-white p-4 rounded-2xl"><Send size={20} /></button>
              </form>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="h-16 w-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all">
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
