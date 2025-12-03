// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import { FileUploadService } from '@/lib/file-utils';
import Upload from '@/models/Upload';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Валидация файла
    const validation = FileUploadService.validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Генерируем уникальное имя файла
    const filename = FileUploadService.generateUniqueFilename(file.name);
    const uploadPath = process.env.STORAGE_PATH || './data/storage';
    const imagesPath = path.join(uploadPath, 'images');

    // Конвертируем File в Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Сохраняем файл на диск
    const filePath = await FileUploadService.saveFile(buffer, filename, imagesPath);

    // Сохраняем информацию в базу данных с привязкой к пользователю
    const upload = await Upload.create({
      filename: filename,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      path: filePath,
      user_id: user.userId
    });

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        filename: upload.filename,
        original_name: upload.original_name,
        mime_type: upload.mime_type,
        size: upload.size,
        url: `/api/uploads/${upload.filename}`,
        created_at: upload.createdAt
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Получаем только файлы текущего пользователя
    const uploads = await Upload.findAll({
      where: { user_id: user.userId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'filename', 'original_name', 'mime_type', 'size', 'createdAt']
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Ошибка получения списка файлов:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}