import { sequelize } from './database';

export const setupDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Настраиваем базу данных...');
    
    // Проверяем существование таблицы users
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('📊 Существующие таблицы:', tableExists);
    
    if (!tableExists.includes('users')) {
      console.log('🆕 Таблица users не найдена, создаем...');
      
      // Создаем таблицу вручную
      await sequelize.getQueryInterface().createTable('users', {
        id: {
          type: 'INTEGER',
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: 'VARCHAR(255)',
          allowNull: false,
          unique: true,
        },
        password: {
          type: 'VARCHAR(255)',
          allowNull: false,
        },
        name: {
          type: 'VARCHAR(255)',
          allowNull: false,
        },
        createdAt: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: 'TIMESTAMP',
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      
      console.log('✅ Таблица users создана успешно');
    } else {
      console.log('✅ Таблица users уже существует');
    }
    
  } catch (error) {
    console.error('❌ Ошибка настройки базы данных:', error);
    throw error;
  }
};