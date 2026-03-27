# Průvodce nasazením: CRM Chat Pro (v121)

Tato aplikace je nyní zcela nezávislá na "Přirozeném zdraví". Zde je scénář, co udělat pro spuštění.

## 1. Lokální spuštění (Testování)
1. Přejdi do složky `D:\OneDrive\ANTIGRANITY\APLIKACE\CRM-CHAT-APP`.
2. Spusť `npm install` (nutné pro stažení knihoven).
3. Vytvoř soubor `.env.local` a vlož do něj klíče ze svého Supabase (najdeš je v Projekt Settings -> API).
4. Spusť `npm run dev`.
5. Aplikace poběží na:
   - **Dashboard**: `http://localhost:3000/admin`
   - **Login**: `http://localhost:3000/login`
   - **Widget**: `http://localhost:3000/widget`

## 2. Příprava n8n (AI mozek)
Aby AI odpovídala, musíš mít v n8n workflow.
- **Webhook URL**: `https://tvuj-web.cz/api/webhook`
- **Secret**: Musí se shodovat s `CRM_CHAT_API_SECRET` ve tvém `.env` souboru.
- *JSON soubor s workflow najdeš v příloze/dalším souboru.*

## 3. Nasazení do světa (Vercel)
1. Vytvoř nové repozitář na GitHubu a nahraj tam obsah složky `CRM-CHAT-APP`.
2. Na Vercelu klikni na "Add New Project" a vyber tento repozitář.
3. V nastavení (Environment Variables) vyplň všechny klíče z `.env.local`.
4. Po nasazení bude tvůj CRM dostupný na tvé vlastní doméně (např. `muj-chat.vercel.app`).

## 4. První kroky po spuštění
1. **Založ si účet**: Jdi do Supabase -> Authentication -> Users -> Add User. Vytvoř si svůj e-mail a heslo.
2. **Přihlas se**: Na adrese `/login`.
3. **Vlož widget**: Do svého jiného webu vlož loader (viz v116/v118) s novou adresou tvého CRM.

🏁 Konec hlášení.
