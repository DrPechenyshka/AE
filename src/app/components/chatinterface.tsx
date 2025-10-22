'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Привет! Я ваш AI-ассистент AntiEcoSys. Чем могу помочь?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Функция для автоматического изменения высоты textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Сбрасываем высоту до авто, чтобы получить правильный scrollHeight
      textarea.style.height = 'auto';
      // Устанавливаем высоту на основе scrollHeight, но не более 150px
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  // Вызываем функцию при изменении текста
  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Сбрасываем высоту textarea после отправки
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);

    // Имитация ответа бота
    setTimeout(() => {
      const responses = [
        "Я понимаю ваш вопрос. Это интересная тема для обсуждения.",
        "Спасибо за ваш запрос! Я могу помочь вам.",
        "Отличный вопрос! Давайте разберем его с точки зрения эффективности.",
        "Как AI-ассистент AntiEcoSys, я специализируюсь на вопросах о нашем оборудовании для персонального пользования."
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleFileAttach = () => {
    // Функционал прикрепления файлов будет добавлен позже
    console.log('Прикрепление файла...');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Основной фон чата с боковыми отступами */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#000] via-gray-800 to-[#cd7f32]">
        <div className="max-w-3xl mx-auto px-6 py-6">
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
                <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Область ввода с боковыми отступами и кнопками под полем ввода */}
      <div className="bg-gray-800 border-t border-gray-700 shadow-2xl">
        <div className="max-w-3xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Контейнер для поля ввода с адаптивной высотой */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Задайте вопрос об экологии или прикрепите файл для анализа..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none transition-all duration-200 ease-in-out min-h-[60px] max-h-[150px] overflow-y-auto"
                disabled={isLoading}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                style={{
                  height: 'auto',
                }}
              />
            </div>
            
            {/* Контейнер для кнопок - под полем ввода и выровнены по правому краю */}
            <div className="flex justify-end space-x-3">
              {/* Кнопка прикрепления файла */}
              <button
                type="button"
                onClick={handleFileAttach}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 border border-gray-600 hover:border-gray-500"
                title="Прикрепить файл"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
                  />
                </svg>
                <span className="text-sm">Прикрепить</span>
              </button>

              {/* Кнопка отправки */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/25"
              >
                <span>Отправить</span>
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
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