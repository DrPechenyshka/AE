// src/lib/database.ts
import { Sequelize } from 'sequelize';
import { setupAssociations } from '@/models/associations'; // <-- импортируем

const isBuildTime = process.env.npm_lifecycle_event === 'build';

export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/antiecosys',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' && !isBuildTime ? console.log : false,
    retry: { max: 5, timeout: 5000 },
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

export const connectDB = async () => {
  if (isBuildTime) {
    console.log('🚧 Пропускаем подключение к БД во время сборки');
    return;
  }

  try {
    console.log('🔗 Пытаемся подключиться к PostgreSQL...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Найден' : 'Не найден');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL подключена успешно');
    
    // Устанавливаем ассоциации
    setupAssociations(); // <-- вызов
    
    await sequelize.sync({ force: false });
    console.log('✅ Модели синхронизированы');
    
  } catch (error: any) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};