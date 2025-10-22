const { sequelize } = require('../src/lib/database');

async function initDatabase() {
  try {
    console.log('🔄 Инициализация базы данных...');
    
    // Подключаемся к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL успешно');
    
    // Синхронизируем модели (создаем таблицы)
    await sequelize.sync({ force: false });
    console.log('✅ Таблицы созданы/проверены');
    
    console.log('🎉 База данных готова к работе!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запускаем только если вызвано напрямую
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };