interface PlayerSettings {
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
}

interface AnimeSaveData {
  player: number;
  dubber: number;
  episode: number;
  time: number;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,
};


const SETTINGS_KEY = "player_settings";
const ANIME_PROGRESS_KEY = "anime_progress";
const HISTORY_KEY = "animeHistory";
const FAVOURITES_KEY = "favourites_list"
const ANIME_STATUS_KEY = "anime_status";


export class SaveManager {
  private static settings: PlayerSettings = DEFAULT_SETTINGS;
  private static animeProgress: Record<string, AnimeSaveData> = {};
  private static animeStatus: Record<string, number> = {};
  // 0: несмотрел
  // 1: Запланированно
  // 2: смотрю
  // 3: просмотренно
  // 4: отложенно
  // 5: брошенно
  // 6: не буду смотреть
  private static history: string[] = [];
  private static favourites: string[] = [];

  static {
    this.initialize();
  }

  private static initialize(): void {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      const savedProgress = localStorage.getItem(ANIME_PROGRESS_KEY);
      if (savedProgress) {
        this.animeProgress = JSON.parse(savedProgress);
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory) || [];
      }

      const savedFavourites = localStorage.getItem(FAVOURITES_KEY);
      if (savedFavourites) {
        this.favourites = JSON.parse(savedFavourites) || [];
      }

      const savedAnimeStatus = localStorage.getItem(ANIME_STATUS_KEY);
      if (savedAnimeStatus) {
        this.animeStatus = JSON.parse(savedAnimeStatus);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }

  static saveSettings(settings: Partial<PlayerSettings>): void {
    this.settings = { ...this.settings, ...settings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  static getSettings(): PlayerSettings {
    return { ...this.settings };
  }

  static setPlaybackSpeed(speed: number): void {
    this.saveSettings({ playbackSpeed: speed });
  }

  static setVolume(volume: number): void {
    this.saveSettings({ volume: volume });
  }

  static setMuted(isMuted: boolean): void {
    this.saveSettings({ isMuted: isMuted });
  }

  static saveAnimeProgress(url: string, data: AnimeSaveData): void {
    console.log("Saving anime progress for URL:", url, "Data:", data);
    this.animeProgress[url] = data;
    try {
      localStorage.setItem(
        ANIME_PROGRESS_KEY,
        JSON.stringify(this.animeProgress),
      );
    } catch (error) {
      console.error("Error saving anime progress:", error);
    }
  }

  static getAnimeProgress(url: string): AnimeSaveData | undefined {
    return this.animeProgress[url] || undefined;
  }

  static getAllAnimeProgress(): Record<string, AnimeSaveData> {
    return { ...this.animeProgress };
  }

  static clearAnimeProgress(url: string): void {
    delete this.animeProgress[url];
    try {
      localStorage.setItem(
        ANIME_PROGRESS_KEY,
        JSON.stringify(this.animeProgress),
      );
    } catch (error) {
      console.error("Error clearing anime progress:", error);
    }
  }

  static saveAnimeToHistory(url: string): void {
    this.history = this.history.filter(item => item !== url);
    this.history.unshift(url);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  static getHistory(): string[] {
    return this.history;
  }

  static addAnimeToFavourites(url: string): void {
    this.favourites = this.favourites.filter(item => item !== url);
    this.favourites.unshift(url);
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(this.favourites));
  }

  static removeAnimeFromFavourites(url: string): void {
    this.favourites = this.favourites.filter(item => item !== url);
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(this.favourites));
  }


  static getFavourites(): string[] {
    return this.favourites;
  }

  static CheckIsFavourite(url: string): boolean {
    return this.favourites.includes(url);
  }

  static setAnimeStatus(url: string, status: number): void {
    if (status == 0) delete this.animeStatus[url];
    else this.animeStatus[url] = status;
    localStorage.setItem(ANIME_STATUS_KEY, JSON.stringify(this.animeStatus));
  }

  static checkAnimeStatus(url: string): number {
    return this.animeStatus[url] || 0;
  }

  static getFullAnimeStatus(): Record<string, number> {
    return this.animeStatus;
  }
}
