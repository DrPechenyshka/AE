// src/lib/auth-utils.ts
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
  role: 'user' | 'moderator' | 'admin';
}

export class AuthService {
  static async generateToken(user: { id: number; email: string; name: string; role: string }): Promise<string> {
    const jwt = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRES_IN)
      .setIssuedAt()
      .sign(JWT_SECRET);

    return jwt;
  }

  static async verifyToken(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { 
      userId: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'user' | 'moderator' | 'admin'
    };
  }

  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    return this.extractTokenFromHeader(authHeader);
  }

  static async authenticateRequest(request: NextRequest): Promise<{ user: AuthUser | null; error: string | null }> {
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      return { user: null, error: 'Токен доступа не предоставлен' };
    }

    try {
      const user = await this.verifyToken(token);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: 'Недействительный токен' };
    }
  }

  static async requireModerator(request: NextRequest): Promise<{ user: AuthUser | null; error: string | null }> {
    const { user, error } = await this.authenticateRequest(request);
    
    if (error || !user) {
      return { user: null, error: error || 'Не авторизован' };
    }
    
    if (user.role !== 'moderator' && user.role !== 'admin') {
      return { user: null, error: 'Доступ запрещен. Требуются права модератора' };
    }
    
    return { user, error: null };
  }

  static async requireAdmin(request: NextRequest): Promise<{ user: AuthUser | null; error: string | null }> {
    const { user, error } = await this.authenticateRequest(request);
    
    if (error || !user) {
      return { user: null, error: error || 'Не авторизован' };
    }
    
    if (user.role !== 'admin') {
      return { user: null, error: 'Доступ запрещен. Требуются права администратора' };
    }
    
    return { user, error: null };
  }
}