"use client";

import * as React from "react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { MessageSquare, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans overflow-hidden w-full">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-12 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-sky-600/5 blur-[60px] rounded-full -mr-10 -mt-10" />
        
        <div className="flex flex-col items-center mb-10 relative">
          <div className="h-16 w-16 bg-sky-600 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-sky-600/20 rotate-3">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            CRM CHAT <span className="text-sky-600 not-italic">PRO</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-3">Administrace chatu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-600 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-12 pr-6 py-5 text-sm font-bold outline-none focus:bg-white focus:border-sky-600 transition-all shadow-inner"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Heslo</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-sky-600 transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl pl-12 pr-6 py-5 text-sm font-bold outline-none focus:bg-white focus:border-sky-600 transition-all shadow-inner"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-3xl py-6 font-black text-xs uppercase tracking-widest shadow-2xl shadow-sky-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Přihlásit se"}
          </button>
        </form>
      </div>
      
      <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-tighter opacity-50">
        CRM-CHAT PRO PRODUKCE v1.0
      </p>
    </div>
  );
}
