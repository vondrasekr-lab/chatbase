import AdminPanel from "@/components/AdminPanel";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <nav className="h-20 border-b bg-white flex items-center px-8 shrink-0">
          <h1 className="font-black italic text-lg tracking-tighter text-slate-900 uppercase">
             CRM CHAT <span className="text-primary not-italic">ADMIN</span>
          </h1>
       </nav>
       <div className="flex-grow">
          <AdminPanel />
       </div>
    </div>
  );
}
