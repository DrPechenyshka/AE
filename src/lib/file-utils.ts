
import path from 'path';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export class FileUploadService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  static validateFile(file: File): FileValidationResult {
    // Проверка размера файла
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Файл слишком большой. Максимальный размер: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Проверка MIME типа
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: `Недопустимый формат файла. Разрешены: ${this.ALLOWED_MIME_TYPES.join(', ')}`
      };
    }

    return { isValid: true };
  }

  static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    return `${name}_${timestamp}_${random}${ext}`;
  }

  static async saveFile(buffer: Buffer, filename: string, uploadPath: string): Promise<string> {
    const fullPath = path.join(uploadPath, filename);
    
    // Создаем директорию если не существует
    await fs.mkdir(uploadPath, { recursive: true });
    
    // Сохраняем файл
    await fs.writeFile(fullPath, buffer);
    
    return fullPath;
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
    }
  }
}