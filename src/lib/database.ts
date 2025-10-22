import { Sequelize } from 'sequelize';

// Проверяем, находимся ли мы в процессе сборки
const isBuildTime = process.env.npm_lifecycle_event === 'build';

export const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/antiecosys',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' && !isBuildTime ? console.log : false,
    retry: {
      max: 5,
      timeout: 5000,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  }
);

export const connectDB = async () => {
  // Не пытаемся подключиться к БД во время сборки
  if (isBuildTime) {
    console.log('🚧 Пропускаем подключение к БД во время сборки');
    return;
  }

  try {
    console.log('🔗 Пытаемся подключиться к PostgreSQL...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Найден' : 'Не найден');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL подключена успешно');
    
    // Синхронизируем модели (создаем таблицы)
    await sequelize.sync({ force: false });
    console.log('✅ Модели синхронизированы');
    
  } catch (error: any) {
    console.error('❌ Ошибка подключения к PostgreSQL:');
    
    if (error.original?.code === 'ECONNREFUSED') {
      console.error('Не удается подключиться к серверу БД');
      console.error('Убедитесь что:');
      console.error('1. PostgreSQL запущена');
      console.error('2. Хост и порт правильные');
      console.error('3. Пользователь и пароль верные');
    } else if (error.name === 'SequelizeConnectionError') {
      console.error('Ошибка подключения Sequelize:', error.message);
    } else {
      console.error('Детали ошибки:', error);
    }
    
    // В продакшене выходим, в разработке продолжаем
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};