import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">S.P.A.C.E.</h1>
        <p className="text-xl text-gray-300 max-w-md mx-auto">
          Security.Protection.Antivirus.Compact.Ecosystem
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/chat"
            className="px-6 py-3 bg-gradient-to-r from-[#9f30ba] to-[#2895ad] hover:from-[#9f30ba] hover:to-[#2563EB] text-white text-base rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
          >
            Перейти к чату
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white text-base font-medium rounded-lg transition-colors"
          >
            Узнать больше
          </Link>
        </div>
      </div>
    </div>
  );
}