'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface FileItem {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  description: string | null;
  createdAt: string;
  filename: string;
}

export default function FilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Параметры из URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [mimeType, setMimeType] = useState(searchParams.get('mimeType') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'DESC');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '10', 10));

  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (mimeType) params.set('mimeType', mimeType);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', page.toString());
    params.set('limit', limit.toString());

    const res = await fetch(`/api/upload?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Обновляем URL при изменении фильтров
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (mimeType) params.set('mimeType', mimeType);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    router.push(`/files?${params.toString()}`);
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, mimeType, sortBy, sortOrder, page, limit]);

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить файл?')) return;
    const res = await fetch(`/api/upload/${id}`, { method: 'DELETE' });
    if (res.ok) fetchFiles();
  };

  const handleEdit = async (id: number, newDescription: string) => {
    const res = await fetch(`/api/upload/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newDescription }),
    });
    if (res.ok) fetchFiles();
  };

  const getFileUrl = (filename: string) => `/api/uploads/${filename}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Мои файлы</h1>

        {/* Фильтры */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">Поиск по имени</label>
            <input
              type="text"
              placeholder="Введите название..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-300 mb-1">Тип файла</label>
            <select
              value={mimeType}
              onChange={(e) => setMimeType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="">Все типы</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/gif">GIF</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-300 mb-1">Сортировать по</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="createdAt">Дата</option>
              <option value="size">Размер</option>
              <option value="original_name">Имя</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-300 mb-1">Порядок</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="DESC">По убыванию</option>
              <option value="ASC">По возрастанию</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-300 mb-1">На странице</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Список файлов */}
        {loading && <p className="text-center text-gray-400">Загрузка...</p>}
        {!loading && files.length === 0 && (
          <p className="text-center text-gray-400">Файлы не найдены</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              <div className="p-4">
                <p className="font-semibold truncate" title={file.original_name}>
                  {file.original_name}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {file.mime_type} | {(file.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(file.createdAt).toLocaleString()}
                </p>
                <div className="mt-3">
                  <input
                    type="text"
                    defaultValue={file.description || ''}
                    onBlur={(e) => handleEdit(file.id, e.target.value)}
                    placeholder="Добавить описание"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
                  />
                </div>
                <div className="mt-4 flex justify-between">
                  <a
                    href={getFileUrl(file.filename)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Открыть
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
          >
            Предыдущая
          </button>
          <span className="text-gray-300">
            Страница {page} из {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition"
          >
            Следующая
          </button>
        </div>
      </div>
    </div>
  );
}