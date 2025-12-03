import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { AuthService } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Проверяем обязательные поля
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      );
    }

    // Создаем пользователя
    const user = await User.create({
      email,
      password,
      name,
    });

    // Генерируем токен
    const token = AuthService.generateToken(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}