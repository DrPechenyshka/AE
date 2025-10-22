export default function About() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">О проекте</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Современный AI-ассистент с интуитивным интерфейсом
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">🚀 Технологии</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Next.js 14 с App Router</li>
              <li>• Tailwind CSS для стилей</li>
              <li>• TypeScript для надежности</li>
              <li>• React Hooks для состояния</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-semibold mb-4 text-green-400">💡 Особенности</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Темная тема для комфорта глаз</li>
              <li>• Адаптивный дизайн</li>
              <li>• Быстрые ответы AI</li>
              <li>• Интуитивный интерфейс</li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h3 className="text-2xl font-semibold mb-6 text-purple-400">📞 Свяжитесь с нами</h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="font-semibold mb-2">Email</h4>
              <p className="text-gray-400">support@aichat.com</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Телефон</h4>
              <p className="text-gray-400">+7 (999) 123-45-67</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Часы работы</h4>
              <p className="text-gray-400">24/7</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}