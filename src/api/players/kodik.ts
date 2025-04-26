import { BaseVideoExtractor, Video } from "./base";

// Регулярное выражение для проверки URL Kodik
const KODIK_URL_REGEX = /^https:\/\/kodik\.info/;
/**
 * Интерфейс для API-запроса Kodik
 */
interface KodikAPIPayload {
  d: string;
  d_sign: string;
  pd: string;
  pd_sign: string;
  ref: string;
  ref_sign: string;
  type: string;
  hash: string;
  id: string;
}

/**
 * Интерфейс для параметров URL Kodik
 */
interface KodikUrlParams {
  d: string;
  d_sign: string;
  pd: string;
  pd_sign: string;
  ref: string;
  ref_sign: string;
  advert_debug: boolean;
  min_age: number;
  first_url: boolean;
}

/**
 * Результат парсинга страницы Kodik
 */
interface KodikPageResult {
  urlParams: KodikUrlParams;
  apiPayload: KodikAPIPayload;
  playerJsPath: string;
}

/**
 * Класс для извлечения видео из плеера Kodik
 */
export class Kodik extends BaseVideoExtractor {
  // Регулярное выражение для валидации URL
  protected static URL_RULE = KODIK_URL_REGEX;

  // Кэширование пути к API для избежания лишних запросов
  private static CACHED_API_PATH: string | null = null;

  // Конфигурация по умолчанию для HTTP-клиента
  protected static DEFAULT_HTTP_CONFIG = { http2: true };

  // Константы для API-запроса
  private static API_CONSTS_PAYLOAD = {
    bad_user: false,
    info: {},
    cdn_is_working: true,
  };

  /**
   * Создает экземпляр парсера Kodik
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
    const fetchOptions: RequestInit = {
      method: "GET",
      ...options,
    };

    // Удаляем старые заголовки из options, чтобы не было конфликта
    delete fetchOptions.headers;

    return await fetch(url, fetchOptions);
  }

  /**
   * Выполняет POST-запрос
   * @param url URL для запроса
   * @param data Данные для отправки
   * @param options Дополнительные опции для запроса
   * @returns Promise с ответом
   */
  private async fetchPost(
    url: string,
    data: KodikAPIPayload,
    headers: any
  ): Promise<Response> {
    const urlSearchParams = new URLSearchParams(Object.entries(data));
    headers["Content-Type"] = "application/x-www-form-urlencoded";

    const fetchOptions: RequestInit = {
      method: "POST",
      body: urlSearchParams,
      headers: headers,
    };

    // Удаляем старые заголовки из options, чтобы не было конфликта
    // delete fetchOptions.headers;

    return fetch(url, fetchOptions);
  }

  /**
   * Расшифровывает URL с помощью пользовательского ROT-шифра
   * @param encodedStr Зашифрованная строка
   * @returns Расшифрованная строка
   */
  private decryptUrl(encodedStr: string): string {
    let string = "";
    for (const char of encodedStr) {
      if (char >= "A" && char <= "Z") {
        string += String.fromCharCode(
          ((char.charCodeAt(0) - 65 + 18) % 26) + 65
        );
      } else if (char >= "a" && char <= "z") {
        string += String.fromCharCode(
          ((char.charCodeAt(0) - 97 + 18) % 26) + 97
        );
      } else {
        string += char;
      }
    }
    return string;
  }

  /**
   * Декодирует URL видео (пользовательский ROT-шифр + base64)
   * @param urlEncoded Зашифрованный URL
   * @returns Декодированный URL
   */
  private decode(urlEncoded: string): string {
    // 7.03.25 kodik remove encoding urls
    if (urlEncoded.endsWith(".m3u8")) {
      return urlEncoded.startsWith("https")
        ? urlEncoded
        : `https:${urlEncoded}`;
    }

    let base64Url = this.decryptUrl(urlEncoded);

    const decodedUrl = atob(base64Url);
    return decodedUrl.startsWith("https") ? decodedUrl : `https:${decodedUrl}`;
  }

  /**
   * Получает имя хоста из URL
   * @param url URL
   * @returns Имя хоста
   */
  private getNetloc(url: string): string {
    // Это может быть kodik, anivod или другие провайдеры
    return new URL(url).hostname;
  }

  /**
   * Создает URL для API запроса
   * @param netloc Имя хоста
   * @param path Путь к API
   * @returns URL для API запроса
   */
  private createUrlApi(netloc: string, path: string = "ftor"): string {
    // После 22.01.24 этот провайдер добавил динамическое изменение пути API
    return `https://${netloc}${path}`;
  }

  /**
   * Создает заголовки для API запроса
   * @param url URL плеера
   * @param netloc Имя хоста
   * @returns Заголовки для API запроса
   */
  private createApiHeaders(
    url: string,
    netloc: string
  ): Record<string, string> {
    return {
      origin: `https://${netloc}`,
      referer: url,
      accept: "application/json, text/javascript, */*; q=0.01",
    };
  }

  /**
   * Проверяет, что видео не найдено
   * @param response Ответ от сервера
   * @returns true, если видео не найдено
   */
  private isNotFoundedVideo(responseText: string): boolean {
    return /<div class="message">Видео не найдено<\/div>/.test(responseText);
  }

  /**
   * Проверяет, что произошла необрабатываемая ошибка
   * @param response Ответ от сервера
   * @returns true, если произошла ошибка
   */
  private isUnhandledErrorResponse(
    response: Response,
    responseText: string
  ): boolean {
    return (
      response.status === 500 &&
      responseText.includes("An unhandled lowlevel error occurred")
    );
  }

  /**
   * Обновляет путь к API
   * @param responseText Текст ответа
   */
  private updateApiPath(responseText: string): void {
    const apiPathMatch =
      /\$\.ajax\([^>]+,url:\s*atob\([\"\']([^"\']+)[\"\']\)/.exec(responseText);

    if (apiPathMatch && apiPathMatch[1]) {
      Kodik.CACHED_API_PATH = atob(apiPathMatch[1]);
    }
  }

  /**
   * Извлекает данные API из ответа
   * @param responseText Текст ответа
   * @returns Результат парсинга страницы
   */
  private extractApiPayload(responseText: string): KodikPageResult {
    // Извлечь urlParams из responseText
    const urlParamsMatch = /var\s*urlParams\s*=\s*['\"](\{.*\})['"]/i.exec(
      responseText
    );
    let urlParams: KodikUrlParams = {} as KodikUrlParams;

    if (urlParamsMatch && urlParamsMatch[1]) {
      try {
        urlParams = JSON.parse(urlParamsMatch[1]) as KodikUrlParams;
      } catch (error) {
        console.error("Error parsing urlParams:", error);
      }
    }

    // Извлечь apiPayload
    const dMatch = /var\s*domain\s+=\s+[\'\"](.*?)[\'\"];/.exec(responseText);
    const dSignMatch = /var\s*d_sign\s+=\s+[\'\"](.*?)[\'\"];/.exec(
      responseText
    );
    const pdMatch = /var\s*pd\s+=\s+[\'\"](.*?)[\'\"];/.exec(responseText);
    const pdSignMatch = /var\s*pd_sign\s+=\s+[\'\"](.*?)[\'\"];/.exec(
      responseText
    );
    const refMatch = /var\s*ref\s+=\s+[\'\"](.*?)[\'\"];/.exec(responseText);
    const refSignMatch = /var\s*ref_sign\s+=\s+[\'\"](.*?)[\'\"];/.exec(
      responseText
    );
    const typeMatch = /videoInfo\.type\s*=\s*[\'\"](.*?)[\'\"];/.exec(
      responseText
    );
    const hashMatch = /videoInfo\.hash\s*=\s*[\'\"](.*?)[\'\"];/.exec(
      responseText
    );
    const idMatch = /videoInfo\.id\s*=\s*[\'\"](.*?)[\'\"];/.exec(responseText);

    const apiPayload: KodikAPIPayload = {
      d: dMatch?.[1] || "",
      d_sign: dSignMatch?.[1] || "",
      pd: pdMatch?.[1] || "",
      pd_sign: pdSignMatch?.[1] || "",
      ref: refMatch?.[1] || "",
      ref_sign: refSignMatch?.[1] || "",
      type: typeMatch?.[1] || "",
      hash: hashMatch?.[1] || "",
      id: idMatch?.[1] || "",
      ...Kodik.API_CONSTS_PAYLOAD,
    };

    // Извлечь playerJsPath
    const playerJsPathMatch =
      /<script\s*type="text\/javascript"\s*src="(\/assets\/js\/app\..*?)">/i.exec(
        responseText
      );
    const playerJsPath = playerJsPathMatch?.[1] || "";

    return {
      urlParams,
      apiPayload,
      playerJsPath,
    };
  }

  /**
   * Извлекает данные из ответа API
   * @param responseApi Ответ API
   * @returns Массив объектов Video
   */
  private extract(responseApi: Record<string, any>): Video[] {
    // Может не существовать ключа '720' для ОЧЕНЬ старых аниме
    // Например: ранний 'One peace!', серии 'Evangelion'
    if (responseApi["720"]) {
      return [
        new Video("m3u8", 360, this.decode(responseApi["360"][0].src)),
        new Video("m3u8", 480, this.decode(responseApi["480"][0].src)),
        new Video("m3u8", 720, this.decode(responseApi["720"][0].src)),
      ];
    } else if (responseApi["480"]) {
      return [
        new Video("m3u8", 360, this.decode(responseApi["360"][0].src)),
        new Video("m3u8", 480, this.decode(responseApi["480"][0].src)),
      ];
    }
    // OMG :O
    return [new Video("m3u8", 360, this.decode(responseApi["360"][0].src))];
  }

  /**
   * Разбирает URL и извлекает информацию о видео
   * @param url URL видео
   * @param options Дополнительные опции
   * @returns Массив объектов Video
   */
  public async parse(url: string): Promise<Video[]> {
    // Проверяем URL на соответствие шаблону
    if (!KODIK_URL_REGEX.test(url)) {
      throw new TypeError(
        `Некорректный URL для плеера ${this.constructor.name}`
      );
    }
    try {
      // Получаем HTML страницы
      const response = await this.fetchGet(url);
      const responseText = await response.text();

      // Проверяем на ошибки
      if (this.isUnhandledErrorResponse(response, responseText)) {
        console.warn(
          'Error! Kodik returns "An unhandled lowlevel error occurred"'
        );
        return [];
      }

      if (this.isNotFoundedVideo(responseText)) {
        console.warn("Error! Video not found");
        return [];
      }

      // Извлекаем данные для API запроса
      const { apiPayload, playerJsPath } = this.extractApiPayload(responseText);
      const netloc = this.getNetloc(url);

      // Если путь к API не кэширован, получаем его
      if (!Kodik.CACHED_API_PATH) {
        const urlJsPlayer = `https://${netloc}${playerJsPath}`;
        const responsePlayer = await this.fetchGet(urlJsPlayer);
        const responsePlayerText = await responsePlayer.text();
        this.updateApiPath(responsePlayerText);
      }

      // Создаем URL для API запроса
      const urlApi = this.createUrlApi(netloc, Kodik.CACHED_API_PATH || "");
      const headers = this.createApiHeaders(url, netloc);

      // Отправляем API запрос
      let responseApi = await this.fetchPost(urlApi, apiPayload, headers);

      // Если API путь устарел, обновляем его
      if (!responseApi.ok) {
        const urlJsPlayer = `https://${netloc}${playerJsPath}`;
        const responsePlayer = await this.fetchGet(urlJsPlayer);
        const responsePlayerText = await responsePlayer.text();
        this.updateApiPath(responsePlayerText);

        const urlApiNew = this.createUrlApi(
          netloc,
          Kodik.CACHED_API_PATH || ""
        );
        responseApi = await this.fetchPost(urlApiNew, apiPayload, headers);
      }

      const responseApiJson = await responseApi.json();
      return this.extract(responseApiJson.links);
    } catch (error) {
      console.error("Error parsing Kodik:", error);
      return [];
    }
  }
}
