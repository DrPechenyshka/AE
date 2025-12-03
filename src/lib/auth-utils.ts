import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  userId: number;
}

export class AuthService {
  static async generateToken(userId: number): Promise<string> {
    const jwt = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRES_IN)
      .setIssuedAt()
      .sign(JWT_SECRET);

    return jwt;
  }

  static async verifyToken(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as number };
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
}