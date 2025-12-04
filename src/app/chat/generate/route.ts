import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-utils';

// Интерфейс для сообщения Ollama
interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
}

// Интерфейс для вложения
interface Attachment {
  url: string;
  type: string;
}

// Интерфейс для запроса
interface GenerateRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    attachments?: Attachment[];
  }>;
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const { user, error } = await AuthService.authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const body: GenerateRequest = await request.json();
    const { messages, model = 'llama3.2:3b' } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Сообщения обязательны' },
        { status: 400 }
      );
    }

    // Формируем сообщения для Ollama
    const ollamaMessages: OllamaMessage[] = messages.map((msg) => {
      const ollamaMsg: OllamaMessage = {
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      };
      
      // Добавляем изображения если есть
      if (msg.attachments && msg.attachments.length > 0) {
        // Фильтруем только изображения
        const imageUrls = msg.attachments
          .filter(att => att.type === 'image')
          .map(att => att.url);
        
        if (imageUrls.length > 0) {
          ollamaMsg.images = imageUrls;
        }
      }
      
      return ollamaMsg;
    });

    // Добавляем системное сообщение для контекста
    ollamaMessages.unshift({
      role: 'system',
      content: `Ты AI-ассистент AntiEcoSys, специализирующийся на экологических вопросах, устойчивом развитии и охране природы.

Твои основные задачи:
1. Отвечать на вопросы об экологии, переработке отходов, изменении климата
2. Давать практические советы по снижению экологического следа
3. Анализировать экологические проблемы на изображениях
4. Предлагать решения для экологических проблем
5. Объяснять сложные экологические концепты простым языком

Правила общения:
- Отвечай только на русском языке
- Будь дружелюбным, но профессиональным
- Предоставляй точную и проверенную информацию
- Если не уверен в ответе, так и скажи
- Для изображений: описывай что видишь и давай экологическую оценку
- Избегай политических тем, сосредоточься на научных фактах

Формат ответов:
1. Краткое понимание вопроса
2. Основной ответ с деталями
3. Практические рекомендации
4. Дополнительные ресурсы при необходимости`
    });

    // URL Ollama API из переменных окружения
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    console.log(`Отправка запроса к Ollama: ${ollamaUrl}/api/chat`);
    
    // Отправляем запрос к Ollama
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
          repeat_penalty: 1.1,
          num_predict: 2048,
        }
      }),
      // Таймаут 5 минут для обработки больших запросов
      signal: AbortSignal.timeout(5 * 60 * 1000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ошибка Ollama API:', response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Модель не найдена в Ollama',
            suggestion: 'Загрузите модель: docker exec antiecosys-ollama ollama pull llama3.2:3b'
          },
          { status: 404 }
        );
      }
      
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      response: data.message.content,
      model: data.model,
      total_duration: data.total_duration,
      prompt_eval_count: data.prompt_eval_count,
      eval_count: data.eval_count,
    });

  } catch (error: any) {
    console.error('Ошибка генерации ответа:', error);
    
    // Проверяем таймаут
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Таймаут при генерации ответа',
          suggestion: 'Попробуйте более короткий запрос или подождите'
        },
        { status: 408 }
      );
    }
    
    // Проверяем, подключена ли Ollama
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    try {
      const testResponse = await fetch(`${ollamaUrl}/api/tags`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!testResponse.ok) {
        return NextResponse.json(
          { 
            error: 'Сервис AI временно недоступен',
            details: 'Ollama не отвечает. Убедитесь, что контейнер ollama запущен.',
            suggestion: 'Запустите: docker-compose up ollama'
          },
          { status: 503 }
        );
      }
    } catch (testError) {
      return NextResponse.json(
        { 
          error: 'Не удается подключиться к Ollama',
          details: 'Проверьте настройки сети и запущен ли контейнер ollama',
          solution: '1. docker-compose up ollama\n2. Проверьте OLLAMA_API_URL в .env'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка при генерации ответа',
        details: error.message || 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

// GET для проверки статуса Ollama
export async function GET(request: NextRequest) {
  try {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    const [modelsResponse, generateResponse] = await Promise.all([
      fetch(`${ollamaUrl}/api/tags`, { 
        signal: AbortSignal.timeout(5000) 
      }).catch(() => null),
      fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:3b',
          prompt: 'test',
          stream: false
        }),
        signal: AbortSignal.timeout(10000)
      }).catch(() => null)
    ]);

    const models = modelsResponse?.ok ? await modelsResponse.json() : null;
    const generate = generateResponse?.ok ? await generateResponse.json() : null;

    return NextResponse.json({
      ollama_status: modelsResponse?.ok ? 'connected' : 'disconnected',
      models_available: models?.models?.length || 0,
      default_model_ready: !!generate,
      ollama_url: ollamaUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ollama_status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}