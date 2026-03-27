-- v119: Multi-tenancy update pro CRM-CHAT PRO

-- 1. Přidání site_id a owner_id do chat_threads
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS site_id UUID DEFAULT gen_random_uuid();
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- 2. Indexace pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_chat_threads_owner ON chat_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_site ON chat_threads(site_id);

-- 3. Aktivace RLS (Row Level Security)
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Politika pro adminy: Vidí jen své thready
DROP POLICY IF EXISTS "Admins can view their own threads" ON chat_threads;
CREATE POLICY "Admins can view their own threads" ON chat_threads
    FOR ALL USING (auth.uid() = owner_id);

-- 5. Politika pro zprávy: Vidí zprávy ze svých threadů
DROP POLICY IF EXISTS "Admins can view messages from their threads" ON chat_messages;
CREATE POLICY "Admins can view messages from their threads" ON chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_threads 
            WHERE chat_threads.id = chat_messages.thread_id 
            AND chat_threads.owner_id = auth.uid()
        )
    );

-- 6. Politika pro anonymní uživatele (widget): Vkládání zpráv (zjednodušeno pro dev)
DROP POLICY IF EXISTS "Anyone can insert messages" ON chat_messages;
CREATE POLICY "Anyone can insert messages" ON chat_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert threads" ON chat_threads;
CREATE POLICY "Anyone can insert threads" ON chat_threads
    FOR INSERT WITH CHECK (true);
