-- Скрипт создания очереди для сырых профилей инвесторов
CREATE TABLE investor_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text TEXT NOT NULL,
    source_url TEXT,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected, duplicate
    extracted_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска по статусу
CREATE INDEX idx_investor_queue_status ON investor_queue(status);

-- Разрешаем чтение/запись всем
ALTER TABLE investor_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON investor_queue FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON investor_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON investor_queue FOR UPDATE USING (true);
