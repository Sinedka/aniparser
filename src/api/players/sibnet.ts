import { BaseVideoExtractor, Video } from "./base";

// Регулярное выражение для проверки URL Sibnet
const SIBNET_URL_REGEX = /https?:\/\/(?:video\.)?sibnet\.ru\/video(\d+)/;

/**
 * Класс для извлечения видео из плеера Sibnet
 */
export class Sibnet extends BaseVideoExtractor {
  // Регулярное выражение для валидации URL
  protected static URL_RULE = SIBNET_URL_REGEX;

  /**
   * Создает экземпляр парсера Sibnet
   */
  constructor() {
    super();
  }

  /**
   * Выполняет GET-запрос
   * @param url URL для запроса
   * @param options Дополнительные опции для запроса
   * @returns Promise с ответом
   */
  private async fetchGet(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = new Headers({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      ...((options.headers as Record<string, string>) || {}),
    });

    const fetchOptions: RequestInit = {
      method: "GET",
      ...options,
    };

    // Удаляем старые заголовки из options, чтобы не было конфликта
    delete fetchOptions.headers;
    // Устанавливаем новые заголовки
    fetchOptions.headers = headers;

    return fetch(url, fetchOptions);
  }

  /**
   * Разбирает URL и извлекает информацию о видео
   * @param url URL видео
   * @param options Дополнительные опции
   * @returns Массив объектов Video
   */
  public async parse(url: string): Promise<Video[]> {
    // Проверяем URL на соответствие шаблону
    if (!SIBNET_URL_REGEX.test(url)) {
      throw new TypeError(
        `Некорректный URL для плеера ${this.constructor.name}`
      );
    }

    try {
      // Получаем HTML страницы
      const response = await this.fetchGet(url);
      const responseText = await response.text();

      // Создаем DOM-парсер
      const parser = new DOMParser();
      const doc = parser.parseFromString(responseText, "text/html");

      // Ищем ссылку на видео
      const videoSrcMatch = /"(?:player"|src)"\s*:\s*"([^"]+\.mp4)"/i.exec(
        responseText
      );

      if (!videoSrcMatch || !videoSrcMatch[1]) {
        // Дополнительная проверка в meta-тегах или других местах страницы
        const metaVideoEl =
          doc.querySelector('meta[property="og:video"]') ||
          doc.querySelector('meta[property="og:video:url"]');
        const metaVideoSrc = metaVideoEl
          ? metaVideoEl.getAttribute("content")
          : null;

        if (metaVideoSrc && metaVideoSrc.endsWith(".mp4")) {
          return [new Video("mp4", 480, this.ensureHttps(metaVideoSrc))];
        }

        // Ищем в плеере
        const playerSrcMatch = /video_src\s*=\s*['"]([^'"]+\.mp4)['"]/i.exec(
          responseText
        );
        if (playerSrcMatch && playerSrcMatch[1]) {
          return [new Video("mp4", 480, this.ensureHttps(playerSrcMatch[1]))];
        }

        console.warn("Sibnet: Не удалось найти ссылку на видео");
        return [];
      }

      // Обрабатываем найденную ссылку
      const videoUrl = this.ensureHttps(videoSrcMatch[1].replace(/\\\//g, "/"));

      // Sibnet обычно предоставляет только один формат видео
      return [new Video("mp4", 480, videoUrl)];
    } catch (error) {
      console.error("Error parsing Sibnet:", error);
      return [];
    }
  }

  /**
   * Обеспечивает, что URL начинается с https://
   * @param url URL для проверки
   * @returns URL с https:// в начале, если необходимо
   */
  private ensureHttps(url: string): string {
    if (url.startsWith("//")) {
      return `https:${url}`;
    }

    if (!url.startsWith("http")) {
      return `https://${url}`;
    }

    return url;
  }
}
