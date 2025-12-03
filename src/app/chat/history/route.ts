// app/api/chat/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import ChatMessage from '@/models/ChatMessage';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Получаем историю сообщений пользователя
    const messages = await ChatMessage.findAll({
      where: { user_id: user.userId },
      order: [['created_at', 'ASC']],
      limit: 50, // Ограничиваем количество сообщений
    });

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id.toString(),
        content: msg.content,
        role: msg.role,
        timestamp: msg.created_at,
        attachments: msg.attachments || [],
      }))
    });
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}