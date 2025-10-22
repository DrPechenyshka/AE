import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Динамический импорт для избежания выполнения во время сборки
const getModels = async () => {
  const { User } = await import('../../../../models/User');
  return { User };
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Проверка обязательных полей
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Динамически импортируем модели
    const { User } = await getModels();

    // Проверка существования пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    return NextResponse.json(
      { 
        message: 'Пользователь успешно зарегистрирован',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}