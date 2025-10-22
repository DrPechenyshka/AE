import { connectDB } from './database';
import { setupDatabase } from './db-setup';

let isConnected = false;

export const initializeDB = async (): Promise<void> => {
  if (isConnected) return;
  
  const maxRetries = 3;
  const retryDelay = 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 Попытка подключения к PostgreSQL (${attempt}/${maxRetries})...`);
      
      await connectDB();
      await setupDatabase();
      
      isConnected = true;
      console.log('✅ База данных полностью инициализирована');
      return;
      
    } catch (error) {
      // Детальная обработка ошибки
      if (error instanceof Error) {
        console.error(`❌ Попытка ${attempt}/${maxRetries} не удалась:`, error.message);
        console.error('Стек ошибки:', error.stack);
      } else {
        console.error(`❌ Попытка ${attempt}/${maxRetries} не удалась:`, String(error));
      }
      
      if (attempt < maxRetries) {
        console.log(`🔄 Следующая попытка через ${retryDelay / 1000} секунд...`);
        await new Promise<void>(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('❌ Не удалось инициализировать БД после всех попыток');
        throw error;
      }
    }
  }
};