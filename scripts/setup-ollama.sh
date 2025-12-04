#!/bin/bash

echo "🚀 Настройка Ollama для AntiEcoSys"

# Проверяем, запущен ли контейнер Ollama
if docker ps | grep -q "antiecosys-ollama"; then
    echo "✅ Контейнер Ollama уже запущен"
else
    echo "🔧 Запускаем контейнер Ollama..."
    docker run -d \
        --name antiecosys-ollama \
        -v ollama_data:/root/.ollama \
        -p 11434:11434 \
        --restart unless-stopped \
        ollama/ollama:latest
    
    echo "⏳ Ждем запуска Ollama..."
    sleep 10
fi

# Проверяем статус Ollama
echo "🔍 Проверяем статус Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama запущен и отвечает"
else
    echo "❌ Ollama не отвечает на порту 11434"
    echo "📋 Проверьте логи: docker logs antiecosys-ollama"
    exit 1
fi

# Проверяем наличие модели
echo "🔍 Проверяем наличие модели llama3.2:3b..."
MODELS=$(curl -s http://localhost:11434/api/tags | jq -r '.models[].name' 2>/dev/null || echo "")

if echo "$MODELS" | grep -q "llama3.2:3b"; then
    echo "✅ Модель llama3.2:3b уже загружена"
else
    echo "📥 Загружаем модель llama3.2:3b..."
    curl -X POST http://localhost:11434/api/pull -d '{"name": "llama3.2:3b"}'
    
    echo "⏳ Загрузка модели может занять несколько минут..."
    echo "📋 Для отслеживания прогресса смотрите логи: docker logs -f antiecosys-ollama"
fi

echo ""
echo "🎉 Настройка завершена!"
echo "📊 Проверить статус: curl http://localhost:11434/api/tags"
echo "🚀 Ollama доступен по адресу: http://localhost:11434"