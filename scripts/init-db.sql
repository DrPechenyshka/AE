-- Проверяем существование таблиц и создаем если нужно
DO $$ 
BEGIN
    -- Проверяем существует ли таблица users
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users') THEN
        -- Создаем таблицу users
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Таблица users создана';
    ELSE
        RAISE NOTICE 'Таблица users уже существует';
    END IF;

    -- Проверяем существует ли таблица uploads
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'uploads') THEN
        -- Создаем таблицу uploads
        CREATE TABLE uploads (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            size INTEGER NOT NULL,
            path VARCHAR(500) NOT NULL,
            user_id INTEGER REFERENCES users(id),
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Создаем индексы для таблицы uploads
        CREATE INDEX idx_uploads_user_id ON uploads(user_id);
        CREATE INDEX idx_uploads_created_at ON uploads("createdAt");
        
        RAISE NOTICE 'Таблица uploads создана';
    ELSE
        RAISE NOTICE 'Таблица uploads уже существует';
    END IF;

    -- Проверяем существует ли таблица chat_messages
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'chat_messages') THEN
        -- Создаем таблицу chat_messages
        CREATE TABLE chat_messages (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            content TEXT,
            role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
            attachments JSONB DEFAULT '[]'::jsonb,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Создаем индексы для таблицы chat_messages
        CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
        CREATE INDEX idx_chat_messages_created_at ON chat_messages("createdAt");
        
        RAISE NOTICE 'Таблица chat_messages создана';
    ELSE
        RAISE NOTICE 'Таблица chat_messages уже существует';
    END IF;
END $$;