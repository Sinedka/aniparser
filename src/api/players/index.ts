import { BaseVideoExtractor, Video } from "./base";
import { Kodik } from "./kodik";
// import { Sibnet } from "./sibnet";
// import { SovetRomantica } from "./sovetromantica";

// Экспорт типов и базовых классов
// export { Video, BaseVideoExtractor } from "./base";

// Экспорт конкретных парсеров плееров
// export { Kodik, Sibnet, SovetRomantica };

// Массив доступных парсеров плееров
export const availablePlayers: (typeof BaseVideoExtractor)[] = [
  Kodik,
  // Sibnet,
  // SovetRomantica,
];

/**
 * Находит подходящий парсер для URL
 * @param url URL видео
 * @returns Экземпляр парсера или null, если подходящий парсер не найден
 */
export function findExtractor(url: string): BaseVideoExtractor | undefined {
  for (const Player of availablePlayers) {
    if (Player.isValidUrl(url)) {
      return new (Player as any)();
    }
  }
  return undefined;
}

/**
 * Получает видео из URL
 * @param url URL видео
 * @returns Массив объектов Video
 */
export async function extractVideos(url: string): Promise<Video[]> {
  const extractor = findExtractor(url);
  if (!extractor) {
    console.warn(`Не найден подходящий парсер для URL: ${url}`);
    return [];
  }

  try {
    return await extractor.parse(url);
  } catch (error) {
    console.error(`Ошибка при извлечении видео из ${url}:`, error);
    return [];
  }
}
