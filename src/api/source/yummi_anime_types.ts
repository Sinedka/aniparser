//Статус аниме
export interface AnimeStatus {
  title: string;
  class: string;
  alias: string;
  value: number;
}

//Постер
export interface Poster {
  big: string;
  fullsize: string;
  huge: string;
  medium: string;
  small: string;
}

//Рейтинг аниме
export interface Rating {
  average: number;
  kp_rating: number;
  anidub_rating: number;
  counters: number;
  myanimelist_rating: number;
  shikimori_rating: number;
  worldart_rating: number;
}

//Тип аниме
export interface AnimeType {
  name: string;
  value: number;
  shortname: string;
}

//Минимальный возраст
export interface MinAge {
  value: number;
  title: string;
  titleLong: string;
}

//Региональные ID
export interface RemoteIds {
  worldart_id: number;
  worldart_type: string;
  kp_id: number;
  anidb_id: number;
  sr_id: number;
  anilibria_alias: string;
  shikimori_id: number;
  myanimelist_id: number;
}

//Создатель
export interface Creator {
  title: string;
  id: number;
  url: string;
}

//Студия
export interface Studio {
  title: string;
  id: number;
  url: string;
}

//Видео
export interface SkipData {
  time: string;
  length: string;
}

export interface Skips {
  opening: SkipData;
  ending: SkipData;
}

export interface VideoData {
  dubbing: string;
  player: string;
}

export interface Video {
  video_id: number;
  iframe_url: string;
  data: VideoData;
  number: string;
  date: number;
  index: number;
  skips: Skips;
}

//Жанр
export interface Genre {
  title: string;
  id: number;
  alias: string;
  url: string;
}

//Переводы
export interface Translates {
  title: string;
  href: string;
  value: string;
}

//Эпизоды
export interface Episodes {
  aired: number;
  count: number;
  next_date: number;
}

//Скриншоты
export interface ScreenshotSizes {
  small: string;
  full: string;
}

export interface RandomScreenshot {
  sizes: ScreenshotSizes;
  id: number;
  time: number;
  episode: number;
}

//Топ аниме
export interface Top {
  category: number;
  global: number;
}

//Порядок просмотра
export interface ViewingOrder {
  title: string;
  anime_id: number;
  type: AnimeType;
  anime_url: string;
  anime_status: AnimeStatus;
  description: string;
  poster: Poster;
  year: number;
  date: number;
}
