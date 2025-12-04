/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // УБЕРИТЕ ЭТУ СТРОКУ - это основная проблема!
  // output: 'standalone',
  
  serverExternalPackages: ['pg', 'pg-native', 'sequelize', 'bcryptjs'],
  
  experimental: {
    // middleware: true,
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
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