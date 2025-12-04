import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import ChatMessage from '@/models/ChatMessage';

// Интерфейс для вложения
interface Attachment {
  id?: string;
  url: string;
  type: string;
  name?: string;
  size?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { content, role, attachments, ai_model } = await request.json();

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Сообщение не может быть пустым' },
        { status: 400 }
      );
    }

    // Сохраняем сообщение в БД
    const message = await ChatMessage.create({
      user_id: user.userId,
      content: content || '',
      role: role || 'user',
      attachments: attachments || [],
      ...(ai_model && { ai_model }),
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        role: message.role,
        timestamp: message.created_at,
        attachments: message.attachments,
        ai_model: message.ai_model,
      }
    });
  } catch (error) {
    console.error('Ошибка сохранения сообщения:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}