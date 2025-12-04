FROM node:18-alpine

WORKDIR /app

# Устанавливаем системные зависимости
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Создаем .env файл с переменными по умолчанию
RUN echo "NODE_ENV=production" > .env

# Собираем приложение
RUN npm run build

# Экспонируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]