import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';
import { FileUploadService } from '@/lib/file-utils';
import { S3Service } from '@/lib/s3-service';
import Upload from '@/models/Upload';
import { Op } from 'sequelize';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: error || 'Необходима авторизация' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    const validation = FileUploadService.validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const s3Key = await S3Service.uploadFile(buffer, file.name, file.type);

    const upload = await Upload.create({
      filename: s3Key.split('/').pop()!,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      s3_key: s3Key,
      user_id: user.userId,
      description: '',
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
        created_at: upload.createdAt,
      },
    });
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await AuthService.authenticateRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: 'Неавторизован' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const mimeType = searchParams.get('mimeType') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const allowedSortFields = ['createdAt', 'size', 'original_name'];
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json({ error: 'Недопустимое поле сортировки' }, { status: 400 });
    }

    const where: any = { user_id: user.userId };
    if (search) {
      where.original_name = { [Op.iLike]: `%${search}%` };
    }
    if (mimeType) {
      where.mime_type = { [Op.eq]: mimeType };
    }
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) where.createdAt[Op.lte] = new Date(toDate);
    }

    const { count, rows } = await Upload.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({
      files: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Ошибка получения списка файлов:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}