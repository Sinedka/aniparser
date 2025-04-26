import { VideoQuality, VideoType } from "../types";

export const ALL_QUALITIES: VideoQuality[] = [144, 240, 360, 480, 720, 1080];

/**
 * Удаляет лишние уровни домена, оставляя только указанное количество
 * @param netloc Доменное имя
 * @param levelsToKeep Количество уровней домена для сохранения
 * @returns Доменное имя с нужным количеством уровней
 */
export function dropDomainLevels(
  netloc: string,
  levelsToKeep: number = 2
): string {
  const parts = netloc.split(".");
  if (levelsToKeep <= 0) {
    throw new Error("levelsToKeep должно быть больше 0");
  }

  if (parts.length > levelsToKeep) {
    return parts.slice(-levelsToKeep).join(".");
  } else {
    return netloc;
  }
}

/**
 * Класс, представляющий видео-контейнер с прямой ссылкой и информацией о типе, качестве
 */
export class Video {
  /**
   * @param type - Тип формата видео ["mp4", "m3u8", "mpd", "audio", "webm"]
   * @param quality - Качество видео [0, 144, 240, 360, 480, 720, 1080] где 0 - аудио
   * @param url - Прямая ссылка на видео
   * @param headers - Заголовки для UserAgent, необходимые для проигрывания или скачивания видео
   */
  constructor(
    public type: VideoType,
    public quality: VideoQuality,
    public url: string,
    public headers: Record<string, string> = {}
  ) {}

  /**
   * Преобразует объект Video в обычный объект
   * @returns Обычный объект с данными видео
   */
  toObject(): Record<string, any> {
    return {
      type: this.type,
      quality: this.quality,
      url: this.url,
      headers: this.headers,
    };
  }

  /**
   * Строковое представление объекта Video
   * @returns Строка с информацией о видео
   */
  toString(): string {
    const url = new URL(this.url);
    return `[${this.quality}] ${url.hostname}...${this.type}`;
  }

  /**
   * Сравнивает два объекта Video
   * @param other Другой объект Video для сравнения
   * @returns true, если объекты эквивалентны
   */
  equals(other: any): boolean {
    if (!(other instanceof Video)) {
      throw new TypeError(`Требуется объект Video, а не ${typeof other}`);
    }

    const thisUrl = new URL(this.url);
    const otherUrl = new URL(other.url);

    const thisNetloc = dropDomainLevels(thisUrl.hostname);
    const otherNetloc = dropDomainLevels(otherUrl.hostname);

    return (
      this.type === other.type &&
      this.quality === other.quality &&
      thisNetloc === otherNetloc
    );
  }
}

/**
 * Базовый класс для экстракторов видео
 */
export abstract class BaseVideoExtractor {
  // Регулярное выражение для валидации URL в методе isValidUrl
  protected static URL_RULE: RegExp | string = /^/; // Пустой паттерн, должен быть переопределен в подклассах

  // Минимальная конфигурация для HTTP-клиента
  protected static DEFAULT_HTTP_CONFIG: Record<string, any> = {};

  /**
   * Проверяет, может ли данный экстрактор обработать указанный URL
   * @param url URL для проверки
   * @returns true, если URL может быть обработан этим экстрактором
   */
  public static isValidUrl(url: string): boolean {
    if (typeof this.URL_RULE === "string") {
      return new RegExp(this.URL_RULE).test(url);
    }
    return this.URL_RULE.test(url);
  }

  /**
   * Разбирает URL и извлекает информацию о видео
   * @param url URL видео
   * @param options Дополнительные опции
   * @returns Массив объектов Video
   */
  public abstract parse(
    url: string,
    options?: Record<string, any>
  ): Promise<Video[]>;
}
