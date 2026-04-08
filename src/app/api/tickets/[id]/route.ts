// src/app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import Ticket from '@/models/Ticket';
import TicketComment from '@/models/TicketComment';
import User from '@/models/User';

type RouteParams = {
  params: Promise<{ id: string }>
};

// GET /api/tickets/[id] - получение конкретного тикета
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const {id} = await params;
    const ticketId = parseInt(id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Неверный ID тикета' },
        { status: 400 }
      );
    }

    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Получаем тикет
    const ticket = await Ticket.findByPk(ticketId, {
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
        {
          model: TicketComment,
          as: 'comments',
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email', 'role'],
            },
          ],
          order: [['created_at', 'ASC']],
        },
      ],
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Тикет не найден' },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (user.role !== 'moderator' && user.role !== 'admin' && ticket.user_id !== user.userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Ошибка получения тикета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - обновление тикета
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const {id} = await params;
    const ticketId = parseInt(id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Неверный ID тикета' },
        { status: 400 }
      );
    }

    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Тикет не найден' },
        { status: 404 }
      );
    }

    // Проверяем права на обновление
    const isModerator = user.role === 'moderator' || user.role === 'admin';
    const isOwner = ticket.user_id === user.userId;

    if (!isModerator && !isOwner) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const updates = await request.json();
    
    // Ограничиваем, что могут обновлять обычные пользователи
    if (!isModerator) {
      // Пользователи могут обновлять только определенные поля
      const allowedFields = ['description', 'attachments'];
      const filteredUpdates: any = {};
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }
      
      // Нельзя изменить статус или приоритет
      await ticket.update(filteredUpdates);
    } else {
      // Модераторы могут обновлять все
      await ticket.update(updates);
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Ошибка обновления тикета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - удаление тикета (только для модераторов)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const {id} = await params;
    const ticketId = parseInt(id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Неверный ID тикета' },
        { status: 400 }
      );
    }

    // Проверяем права модератора
    const { user, error } = await AuthService.requireModerator(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Тикет не найден' },
        { status: 404 }
      );
    }

    // Удаляем тикет
    await ticket.destroy();

    return NextResponse.json({
      success: true,
      message: 'Тикет успешно удален',
    });
  } catch (error) {
    console.error('Ошибка удаления тикета:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}