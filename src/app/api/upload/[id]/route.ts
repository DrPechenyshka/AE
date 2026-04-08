import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import Upload from '@/models/Upload';
import { S3Service } from '@/lib/s3-service';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const { description } = await request.json();
    const upload = await Upload.findOne({ where: { id: params.id, user_id: user.userId } });
    if (!upload) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    upload.description = description;
    await upload.save();

    return NextResponse.json({ success: true, file: upload });
  } catch (error) {
    console.error('Ошибка обновления файла:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const upload = await Upload.findOne({ where: { id: params.id, user_id: user.userId } });
    if (!upload) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 });
    }

    await S3Service.deleteFile(upload.s3_key);
    await upload.destroy();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}