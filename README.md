# CRM Chat Pro (v118)

Toto je samostatná instance platformy pro správu chatů.

## Rychlý start
1. Přejděte do adresáře `CRM-CHAT-APP`.
2. Spusťte `npm install` pro instalaci závislostí.
3. Nastavte proměnné v souboru `.env.local` (viz `.env.example`).
4. Spusťte vývojový server pomocí `npm run dev`.

## Struktura
- `/admin`: Administrační panel pro operátora (PWA).
- `/widget`: Stránka pro vložení widgetu přes Iframe.
- `/api/webhook`: Endpoint pro příjem zpráv z n8n/AI.

## Multi-tenancy
Projekt je připraven na osamostatnění. Pokud chcete přidat další klienty, stačí implementovat filtraci dle `site_id` v tabulkách Supabase.
