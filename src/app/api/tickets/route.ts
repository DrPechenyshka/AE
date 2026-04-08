// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    let whereClause: any = {};

    // Если пользователь не модератор, показываем только его тикеты
    if (user.role !== 'moderator' && user.role !== 'admin') {
      whereClause.user_id = user.userId;
    } else {
      // Модераторы могут фильтровать по пользователю
      if (userId) {
        whereClause.user_id = userId;
      }
    }

    // Добавляем фильтры
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    // Получаем тикеты
    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Ошибка получения тикетов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}