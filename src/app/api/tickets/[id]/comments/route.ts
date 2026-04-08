import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import TicketComment from '@/models/TicketComment';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

// Правильный тип для Next.js 15 - params это Promise
type RouteParams = {
  params: Promise<{ id: string }>
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ждем разрешения params (обязательно для Next.js 15)
    const { id } = await params;
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

    // Проверяем существование тикета
    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Тикет не найден' },
        { status: 404 }
      );
    }

    // Проверяем права доступа к комментарию
    if (user.role !== 'moderator' && user.role !== 'admin' && ticket.user_id !== user.userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    const { content, attachments } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Содержание комментария обязательно' },
        { status: 400 }
      );
    }

    // Создаем комментарий
    const comment = await TicketComment.create({
      ticket_id: ticketId,
      user_id: user.userId,
      content,
      attachments: attachments || [],
    });

    // Получаем комментарий с информацией о пользователе
    const commentWithUser = await TicketComment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });

    return NextResponse.json({
      success: true,
      comment: commentWithUser,
    });
  } catch (error) {
    console.error('Ошибка создания комментария:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}