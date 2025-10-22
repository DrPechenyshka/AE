import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AntiEcoSys',
  description: 'Интеллектуальная платформа для экологического мониторинга',
};

// Убираем подключение к БД из layout - оно будет в отдельных API routes
// БД будет подключаться только когда действительно нужна

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} h-full bg-gray-900`}>
        <Header />
        <main className="h-full">
          {children}
        </main>
      </body>
    </html>
  );
}