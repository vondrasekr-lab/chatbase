-- v130: Site ID a správa webů pro CRM-CHAT PRO

-- 1. Tabulka pro weby (tenanti)
CREATE TABLE IF NOT EXISTS chat_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexace
CREATE INDEX IF NOT EXISTS idx_chat_sites_owner ON chat_sites(owner_id);

-- 3. RLS pro chat_sites
ALTER TABLE chat_sites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their sites" ON chat_sites;
CREATE POLICY "Owners can manage their sites" ON chat_sites
    FOR ALL USING (auth.uid() = owner_id);

-- 4. Propojení chat_threads s chat_sites (v119 už přidal column, zde jen upřesníme)
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS chat_threads_site_id_fkey;
ALTER TABLE chat_threads ADD CONSTRAINT chat_threads_site_id_fkey 
    FOREIGN KEY (site_id) REFERENCES chat_sites(id) ON DELETE SET NULL;

-- 5. Funkce pro automatické Site ID (při prvním přihlášení admina)
-- (Tuto část vyřešíme raději v serverové akci pro větší kontrolu)
