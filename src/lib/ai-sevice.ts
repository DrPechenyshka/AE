import ChatMessage from '@/models/ChatMessage';

export interface AIServiceConfig {
  baseUrl?: string;
  defaultModel?: string;
  temperature?: number;
  maxTokens?: number;
}

// Интерфейс для вложения
export interface Attachment {
  id?: string;
  url: string;
  type: string;
  name?: string;
  size?: number;
}

// Интерфейс для сообщения
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export class AIService {
  private static instance: AIService;
  private config: AIServiceConfig;

  private constructor(config: AIServiceConfig = {}) {
    this.config = {
      baseUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
      defaultModel: 'llama3.2:3b',
      temperature: 0.7,
      maxTokens: 2048,
      ...config,
    };
  }

  static getInstance(config?: AIServiceConfig): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService(config);
    }
    return AIService.instance;
  }

  async generateResponse(
    userId: number,
    userMessage: string,
    attachments?: Attachment[],
    contextMessages: Message[] = []
  ): Promise<{ response: string; model: string; duration?: number }> {
    try {
      // Получаем контекст из истории (последние 10 сообщений)
      const history = await ChatMessage.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 10,
      });

      const messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
        images?: string[];
      }> = [
        // Системный промпт
        {
          role: 'system',
          content: `Ты AI-ассистент AntiEcoSys, специализирующийся на экологических вопросах.
Отвечай на русском языке профессионально и дружелюбно.
Если пользователь присылает изображения, анализируй их и давай рекомендации.`
        },
        // История сообщений (в обратном порядке)
        ...history.reverse().map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content || '',
        })),
        // Новое сообщение пользователя
        {
          role: 'user',
          content: userMessage,
          ...(attachments && attachments.length > 0 && { 
            images: attachments.map(a => a.url) 
          })
        },
      ];

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.defaultModel,
          messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        response: data.message.content,
        model: data.model,
        duration: data.total_duration ? data.total_duration / 1e9 : undefined,
      };

    } catch (error) {
      console.error('Ошибка AI сервиса:', error);
      
      // Заглушка на случай недоступности Ollama
      return {
        response: this.getFallbackResponse(userMessage, attachments),
        model: 'fallback',
      };
    }
  }

  private getFallbackResponse(userMessage: string, attachments?: Attachment[]): string {
    let response = "Я AI-ассистент AntiEcoSys. К сожалению, нейросеть временно недоступна.\n\n";
    
    if (userMessage.toLowerCase().includes('эколог')) {
      response += "Для эффективной работы с экологическими вопросами требуется запустить локальную нейросеть Ollama.\n\n";
    }
    
    if (attachments && attachments.length > 0) {
      response += `Получено ${attachments.length} изображение(ий). Для анализа изображений требуется нейросеть.\n\n`;
    }
    
    response += "**Для включения AI:**\n";
    response += "1. Убедитесь, что Docker запущен\n";
    response += "2. Запустите: `docker-compose up ollama`\n";
    response += "3. Или скачайте Ollama с сайта: https://ollama.com";
    
    return response;
  }

  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Ошибка получения списка моделей:', error);
      return [];
    }
  }

  async pullModel(modelName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      return response.ok;
    } catch (error) {
      console.error(`Ошибка загрузки модели ${modelName}:`, error);
      return false;
    }
  }

  async checkHealth(): Promise<{ status: string; models?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        return { status: 'unhealthy', error: `HTTP ${response.status}` };
      }
      
      const data = await response.json();
      return { 
        status: 'healthy', 
        models: data.models?.map((m: any) => m.name) 
      };
    } catch (error) {
      return { 
        status: 'unavailable', 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Метод для простой генерации без истории пользователя
  async simpleGenerate(
    prompt: string, 
    model?: string
  ): Promise<{ response: string; model: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.config.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        response: data.response,
        model: data.model,
      };
    } catch (error) {
      console.error('Ошибка простой генерации:', error);
      return {
        response: 'Ошибка при обращении к нейросети. Проверьте подключение к Ollama.',
        model: 'error',
      };
    }
  }
}