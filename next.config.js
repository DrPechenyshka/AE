/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Важно: указываем какие пакеты должны быть включены в сборку
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-native', 'sequelize'],
  },
  // Принудительно включаем пакет pg в сборку
  serverExternalPackages: ['pg', 'pg-native', 'bcryptjs'],
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