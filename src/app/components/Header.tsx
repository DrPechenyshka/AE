'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import AuthModal from './AuthModal';

export default function Header() {
  const pathname = usePathname();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleAuthSuccess = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <>
      <nav className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Логотип слева */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/images/star_logo_v2.png" 
                  alt="Логотип S.P.A.C.E." 
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                S.P.A.C.E.
              </span>
            </Link>

            {/* Навигационные ссылки по центру */}
            <div className="hidden md:flex space-x-8">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Главная
              </Link>
              <Link 
                href="/chat" 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/chat' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Чат
              </Link>
              <Link 
                href="/about" 
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/about' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                О проекте
              </Link>
            </div>

            {/* Кнопка входа/профиля справа */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300 text-sm hidden sm:block">
                    Привет, {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-300"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#2895ad] to-[#9f30ba] hover:from-[#2563EB] hover:to-[#9f30ba] text-white text-base rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                >
                  Войти / Регистрация
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}