/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Убрана устаревшая опция из experimental
  // serverComponentsExternalPackages перемещено в serverExternalPackages
  
  // Современный способ: указываем какие пакеты должны быть включены в сборку
  serverExternalPackages: ['pg', 'pg-native', 'sequelize', 'bcryptjs'],
  
  // Для работы с cookies в middleware
  experimental: {
    // middleware: true, // Раскомментировать если нужно
  },
  
  // Отключаем оптимизации которые могут мешать
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // Убедимся что pg не экстернализируется
      config.externals.push(({ context, request }, callback) => {
        if (request === 'pg' || request === 'pg-native') {
          return callback();
        }
        return callback();
      });
    }
    return config;
  }
}

module.exports = nextConfig