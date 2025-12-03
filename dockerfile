FROM node:18-alpine

WORKDIR /app

# Устанавливаем PostgreSQL клиент и необходимые зависимости
RUN apk add --no-cache \
    postgresql-client \
    postgresql-dev \
    python3 \
    make \
    g++

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (включая pg - драйвер PostgreSQL)
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем .env.production файл с фиктивными значениями для сборки
RUN mkdir -p /data/storage/images /data/storage/uploads /app/logs

RUN echo "DATABASE_URL=postgresql://dummy:dummy@dummy:5432/dummy" > .env.production
RUN echo "JWT_SECRET=dummy-jwt-secret-for-build" >> .env.production
RUN echo "NODE_ENV=production" >> .env.production

# Собираем приложение
RUN npm run build

# Удаляем фиктивный .env.production
RUN rm .env.production

# Экспонируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]