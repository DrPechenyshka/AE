// middleware.ts (обновленный)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  // Пропускаем публичные маршруты
  const publicRoutes = [
    '/api/auth',
    '/login',
    '/register',
    '/',
  ];

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Проверяем аутентификацию для защищенных маршрутов
  const { user, error } = await AuthService.authenticateRequest(request);

  if (error || !user) {
    // Для API маршрутов возвращаем JSON ошибку
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }
    // Для страниц перенаправляем на логин
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Добавляем информацию о пользователе в заголовки
  const response = NextResponse.next();
  response.headers.set('X-User-ID', user.userId.toString());

  return response;
}

export const config = {
  matcher: [
    '/api/upload/:path*',
    '/api/uploads/:path*',
    '/api/chat/:path*',
    '/profile/:path*',
    '/upload/:path*',
    '/chat/:path*',
  ],
};