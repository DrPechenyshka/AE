'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Интерфейс для вложения (прикрепленного файла)
interface Attachment {
  id: string;
  url: string;
  type: 'image' | 'file';
  name: string;
  size: number;
}

// Интерфейс для сообщения чата
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  attachments?: Attachment[];
}

export default function ChatInterface() {
  // Состояния компонента
  const [messages, setMessages] = useState<Message[]>([
    // Приветственное сообщение от бота
    {
      id: '1',
      content: 'Привет! Я ваш AI-ассистент AntiEcoSys. Чем могу помочь?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // Референсы для DOM элементов
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Для навигации
  const router = useRouter();

  // ========== ФУНКЦИИ ДЛЯ РАБОТЫ С АУТЕНТИФИКАЦИЕЙ ==========

  // Получение токена из разных источников
  const getToken = (): string | null => {
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') ||
           getCookie('token');
  };

  // Получение cookie по имени
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Очистка данных аутентификации
  const clearAuthData = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  // Перенаправление на страницу логина если нет токена
  const redirectToLoginIfNoToken = () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return false;
    }
    return true;
  };

  // ========== ЭФФЕКТЫ ПРИ МОНТИРОВАНИИ ==========

  // Загрузка истории чата при монтировании компонента
  useEffect(() => {
    const loadChatHistory = async () => {
      const token = getToken();
      
      if (!token) {
        // Если нет токена, показываем только приветственное сообщение
        return;
      }
      
      setUserToken(token);
      
      try {
        const response = await fetch('/api/chat/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            // Преобразуем данные из API в формат компонента
            const loadedMessages = data.messages.map((msg: any) => ({
              id: msg.id.toString(),
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.timestamp),
              attachments: msg.attachments || [],
            }));
            setMessages(loadedMessages);
          }
        } else if (response.status === 401) {
          // Токен устарел, очищаем данные и перенаправляем
          clearAuthData();
          router.push('/login');
        }
      } catch (error) {
        console.error('Ошибка загрузки истории чата:', error);
      }
    };

    loadChatHistory();
  }, [router]);

  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Автоматическая регулировка высоты textarea
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

  // Функция для автоматического изменения высоты textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ========== ФУНКЦИИ ДЛЯ СОХРАНЕНИЯ СООБЩЕНИЙ В БАЗЕ ==========

  // Сохранение сообщения в базу данных
  const saveMessageToDB = async (message: Message): Promise<boolean> => {
    try {
      const token = getToken();
      
      if (!token) {
        console.error('Токен не найден при сохранении сообщения');
        return false;
      }

      const response = await fetch('/api/chat/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message.content,
          role: message.role,
          attachments: message.attachments,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Ошибка сохранения сообщения в БД:', error);
      return false;
    }
  };

  // ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ ==========

  // Загрузка файлов на сервер
  const handleFileUpload = async (files: FileList) => {
    if (!redirectToLoginIfNoToken()) return;

    const token = getToken();
    if (!token) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Проверка типа файла (только изображения)
        if (!file.type.startsWith('image/')) {
          alert('Можно загружать только изображения');
          continue;
        }

        // Проверка размера файла (максимум 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('Размер файла не должен превышать 10MB');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка загрузки файла');
        }

        const result = await response.json();

        if (result.success && result.upload) {
          // Добавляем загруженный файл в список вложений
          setAttachments(prev => [...prev, {
            id: result.upload.id,
            url: result.upload.url,
            type: 'image',
            name: result.upload.original_name,
            size: result.upload.size
          }]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  // Обработчик выбора файлов через input
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Сбрасываем значение input для возможности повторной загрузки
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Обработчики drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  // Удаление прикрепленного файла
  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  // ========== ОСНОВНАЯ ЛОГИКА ЧАТА ==========

  // Отправка сообщения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем, что есть что отправить
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    
    // Проверяем авторизацию
    if (!redirectToLoginIfNoToken()) return;

    // Создаем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    // Сохраняем сообщение пользователя в базу данных
    await saveMessageToDB(userMessage);

    // Добавляем сообщение в локальное состояние
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    // Сбрасываем высоту textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);

    // Имитация ответа AI-ассистента (временная заглушка)
    setTimeout(async () => {
      let responseText = "Спасибо за ваше сообщение!";
      
      // Добавляем информацию о файлах если они есть
      if (attachments.length > 0) {
        responseText += ` Я получил ${attachments.length} изображение(ий) и анализирую их.`;
      }

      // Создаем ответное сообщение от ассистента
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        role: 'assistant',
        timestamp: new Date(),
      };

      // Сохраняем ответ ассистента в базу данных
      await saveMessageToDB(botMessage);
      
      // Добавляем ответ в чат
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500); // Имитация задержки обработки
  };

  // Обработчик клика на кнопку прикрепления файла
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  // ========== РЕНДЕРИНГ КОМПОНЕНТА ==========

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Скрытый input для выбора файлов */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Основная область чата */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#000] via-gray-800 to-[#cd7f32]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Отображение всех сообщений */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-6 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none border border-blue-500'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600'
                }`}
              >
                {/* Текст сообщения */}
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                
                {/* Вложения (если есть) */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="relative">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-20 h-20 object-cover rounded-lg border border-white/20"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Время отправки сообщения */}
                <div className={`text-xs opacity-70 mt-2 text-right ${
                  message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString('ru-RU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Индикатор набора текста AI */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-600 shadow-lg">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-gray-400 ml-2">AI печатает...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Якорь для автоматической прокрутки */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Панель ввода сообщений */}
      <div className="bg-gray-800 border-t border-gray-700 shadow-2xl">
        <div className="max-w-3xl mx-auto p-6">
          
          {/* Область предпросмотра прикрепленных файлов */}
          {attachments.length > 0 && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Прикрепленные изображения:</span>
                <span className="text-xs text-gray-400">{attachments.length} файл(ов)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover rounded border border-gray-500"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      aria-label="Удалить файл"
                    >
                      ×
                    </button>
                    <div className="text-xs text-gray-400 mt-1 truncate max-w-16">
                      {attachment.name.length > 10 
                        ? `${attachment.name.substring(0, 8)}...` 
                        : attachment.name
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Индикатор загрузки файлов */}
          {uploading && (
            <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <div className="flex items-center space-x-2 text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">Загрузка изображений...</span>
              </div>
            </div>
          )}

          {/* Форма для отправки сообщений */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Поле ввода текста с поддержкой drag and drop */}
            <div 
              className="relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Задайте вопрос об экологии или перетащите изображения для анализа..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none transition-all duration-200 ease-in-out min-h-[60px] max-h-[150px] overflow-y-auto"
                disabled={isLoading || uploading}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                aria-label="Поле ввода сообщения"
              />
              
              {/* Визуальный индикатор drag and drop */}
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl pointer-events-none opacity-0 transition-opacity duration-200"
                   style={{ opacity: attachments.length > 0 ? 0 : 0.5 }}>
                <div className="flex items-center justify-center h-full">
                  <span className="text-blue-400 text-sm">Перетащите изображения сюда</span>
                </div>
              </div>
            </div>
            
            {/* Панель кнопок */}
            <div className="flex justify-end space-x-3">
              {/* Кнопка прикрепления файла */}
              <button
                type="button"
                onClick={handleFileAttach}
                disabled={isLoading || uploading}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Прикрепить файл"
                aria-label="Прикрепить файл"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
                    />
                  </svg>
                )}
                <span className="text-sm">
                  {uploading ? 'Загрузка...' : 'Прикрепить'}
                </span>
              </button>

              {/* Кнопка отправки сообщения */}
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || uploading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/25"
                aria-label="Отправить сообщение"
              >
                <span>Отправить</span>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              </button>
            </div>
          </form>
          
          {/* Информационная строка */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 px-1 space-y-2 sm:space-y-0">
            <p className="text-xs text-gray-400">
              AntiEcoSys AI • Может иногда генерировать неточную информацию
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
              <span>Enter ↵ для отправки</span>
              <span>Shift + Enter ↵ для новой строки</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}