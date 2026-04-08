// scripts/init-db.js
const { sequelize } = require('../src/lib/database');
const User = require('../src/models/User').default;
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔄 Инициализация базы данных...');
    
    // Подключаемся к БД
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL успешно');
    
    // Синхронизируем модели (создаем таблицы)
    await sequelize.sync({ force: true }); // force: true для тестирования, потом изменить на false
    console.log('✅ Таблицы созданы/проверены');

    // Создаем тестового модератора
    const moderatorEmail = 'moderator@example.com';
    const existingModerator = await User.findOne({ where: { email: moderatorEmail } });
    
    if (!existingModerator) {
      await User.create({
        email: moderatorEmail,
        password: 'moderator123',
        name: 'Тестовый Модератор',
        role: 'moderator'
      });
      console.log('✅ Создан тестовый модератор');
    }

    // Создаем тестового админа
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'admin123',
        name: 'Тестовый Админ',
        role: 'admin'
      });
      console.log('✅ Создан тестовый администратор');
    }

    // Создаем тестового пользователя
    const userEmail = 'user@example.com';
    const existingUser = await User.findOne({ where: { email: userEmail } });
    
    if (!existingUser) {
      await User.create({
        email: userEmail,
        password: 'user123',
        name: 'Тестовый Пользователь',
        role: 'user'
      });
      console.log('✅ Создан тестовый пользователь');
    }
    
    console.log('🎉 База данных готова к работе!');
    console.log('\nТестовые учетные записи:');
    console.log('👤 Пользователь: user@example.com / user123');
    console.log('🛡️ Модератор: moderator@example.com / moderator123');
    console.log('⚡ Админ: admin@example.com / admin123');
    
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