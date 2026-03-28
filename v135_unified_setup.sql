-- v135: Kompletní databázové schéma pro CRM-CHAT PRO (Unified)
-- Tento skript vytvoří vše potřebné pro spuštění multi-tenancy chatu.

-- 1. TABULKA PRO WEBY (SITES)
CREATE TABLE IF NOT EXISTS chat_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABULKA PRO KONVERZACE (THREADS)
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES chat_sites(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    full_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    unread_count INTEGER DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID, -- Pro budoucí login návštěvníků
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABULKA PRO ZPRÁVY (MESSAGES)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INDEXACE PRO RYCHLOST
CREATE INDEX IF NOT EXISTS idx_chat_threads_owner ON chat_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_site ON chat_threads(site_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id);

-- 5. ZABEZPEČENÍ (RLS)
ALTER TABLE chat_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politiky pro majitele (Admin Panel)
DROP POLICY IF EXISTS "Owners manage their sites" ON chat_sites;
CREATE POLICY "Owners manage their sites" ON chat_sites FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners view their threads" ON chat_threads;
CREATE POLICY "Owners view their threads" ON chat_threads FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners view their messages" ON chat_messages;
CREATE POLICY "Owners view their messages" ON chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chat_threads WHERE chat_threads.id = chat_messages.thread_id AND chat_threads.owner_id = auth.uid())
);

-- Politiky pro anonymní přístup (Widget) - umožnění vkládání
DROP POLICY IF EXISTS "Anons insert threads" ON chat_threads;
CREATE POLICY "Anons insert threads" ON chat_threads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anons insert messages" ON chat_messages;
CREATE POLICY "Anons insert messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Realtime pro Admin Panel
ALTER PUBLICATION supabase_realtime ADD TABLE chat_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
