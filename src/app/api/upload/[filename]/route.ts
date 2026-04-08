import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import Upload from '@/models/Upload';
import { S3Service } from '@/lib/s3-service';

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const upload = await Upload.findOne({
      where: { filename: params.filename, user_id: user.userId },
    });
    if (!upload) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    const url = await S3Service.getPresignedUrl(upload.s3_key);
    // Перенаправляем на pre-signed URL
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Ошибка получения файла:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}