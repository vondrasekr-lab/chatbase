import Link from "next/link";
import { MessageSquare, LayoutDashboard, Settings, Rocket } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <span className="font-black text-xl italic tracking-tighter text-slate-900">CRM CHAT <span className="text-primary text-sm not-italic align-top ml-1">PRO</span></span>
          </div>
          <Link href="/admin" className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all">
            Správa chatů
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-6xl font-black italic text-slate-900 leading-[1.1] mb-8">
            Váš chat,<br />vaše pravidla.<br />
            <span className="text-primary">Kdekoliv.</span>
          </h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
            Nainstalujte si chatbox do jakékoliv webové stránky pomocí jednoho řádku kódu. 
            Všechny zprávy spravujte z jedné přehledné aplikace.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-default">
              <div className="h-14 w-14 bg-white text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <LayoutDashboard size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 italic">Dashboard</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Kompletní přehled o všech konverzacích, návštěvnících a jejich polohách.
              </p>
            </div>
            
            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-default text-primary">
              <div className="h-14 w-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Rocket size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 italic text-slate-900">Univerzální Widget</h3>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Jedenloader, nekonečné možnosti. Integrujte ho do WordPressu, E-shopu nebo Reactu.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
