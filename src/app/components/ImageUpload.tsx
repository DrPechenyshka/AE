// components/ImageUpload.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

interface UploadedFile {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
}

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Получаем токен из localStorage при загрузке компонента
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    
    // Загружаем существующие файлы пользователя
    if (storedToken) {
      loadUserFiles(storedToken);
    }
  }, []);

  const loadUserFiles = async (userToken: string) => {
    try {
      const response = await fetch('/api/upload', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.uploads || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки файлов:', err);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!token) {
      setError('Необходима авторизация');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка загрузки');
      }

      setSuccess('Файл успешно загружен!');
      setUploadedFiles(prev => [result.upload, ...prev]);
      
      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Для загрузки изображений необходимо авторизоваться</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          uploading ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="space-y-2">
          {uploading ? (
            <div className="text-blue-600">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p>Загрузка...</p>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900">Перетащите изображение сюда</p>
              <p className="text-sm text-gray-500">или нажмите для выбора файла</p>
              <p className="text-xs text-gray-400">Максимальный размер: 10MB</p>
              <p className="text-xs text-gray-400">Форматы: JPEG, PNG, GIF, WebP, SVG</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ваши загруженные изображения</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg overflow-hidden">
                <img
                  src={file.url}
                  alt={file.original_name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{file.original_name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}