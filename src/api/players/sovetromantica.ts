import { BaseVideoExtractor, Video } from "./base";

// Регулярное выражение для проверки URL SovetRomantica
const SR_URL_REGEX =
  /https?:\/\/(?:sovetromantica\.(?:com|moe)|sr-cdn\.com)\/embed\/.+/;

// Типы качества видео
type SRQuality = "720" | "480" | "360";

/**
 * Интерфейс для видео из SovetRomantica
 */
interface SRVideo {
  src: string;
  type: string;
}

/**
 * Интерфейс для хранилища видео из SovetRomantica
 */
interface SRStorage {
  [quality: string]: SRVideo;
}

/**
 * Интерфейс для данных видео из SovetRomantica
 */
interface SRData {
  storages: SRStorage;
}

/**
 * Класс для извлечения видео из плеера SovetRomantica
 */
export class SovetRomantica extends BaseVideoExtractor {
  // Регулярное выражение для валидации URL
  protected static URL_RULE = SR_URL_REGEX;

  /**
   * Создает экземпляр парсера SovetRomantica
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
    if (!SR_URL_REGEX.test(url)) {
      throw new TypeError(
        `Некорректный URL для плеера ${this.constructor.name}`
      );
    }

    try {
      // Получаем HTML страницы
      const response = await this.fetchGet(url);
      const responseText = await response.text();

      // Извлекаем JSON-данные с информацией о видео
      const dataMatch = /window\.playerConfig\s*=\s*({[\s\S]+?});/.exec(
        responseText
      );

      if (!dataMatch) {
        console.warn("SovetRomantica: Не удалось найти данные плеера");
        return [];
      }

      try {
        // Парсим данные
        const playerConfig = JSON.parse(dataMatch[1]);
        const data: SRData = playerConfig.data;

        if (!data.storages) {
          console.warn("SovetRomantica: Нет данных о хранилищах видео");
          return [];
        }

        const videos: Video[] = [];

        // Качества видео от высшего к низшему
        const qualities: SRQuality[] = ["720", "480", "360"];

        for (const quality of qualities) {
          if (data.storages[quality]) {
            const storage = data.storages[quality];
            const videoType = storage.type === "mp4" ? "mp4" : "m3u8";
            const videoQuality = parseInt(quality) as 360 | 480 | 720;

            videos.push(new Video(videoType, videoQuality, storage.src));
          }
        }

        return videos;
      } catch (error) {
        console.error(
          "SovetRomantica: Ошибка при парсинге данных плеера:",
          error
        );
        return [];
      }
    } catch (error) {
      console.error("Error parsing SovetRomantica:", error);
      return [];
    }
  }
}
