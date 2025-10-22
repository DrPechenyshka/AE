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
END $$;