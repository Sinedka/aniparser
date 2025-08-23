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

class AnimeHistory {
  private static STORAGE_KEY = "animeHistory";

  static saveAnimeToHistory(url: string): void {
    const history = this.getHistory();
    const updatedHistory = history.filter(item => item !== url);
    updatedHistory.unshift(url);
    const limitedHistory = updatedHistory.slice(0, 50);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));
  }

  static getHistory(): string[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

const DEFAULT_SETTINGS: PlayerSettings = {
  playbackSpeed: 1.0,
  volume: 1.0,
  isMuted: false,
};


const SETTINGS_KEY = "player_settings";
const ANIME_PROGRESS_KEY = "anime_progress";
const STORAGE_KEY = "animeHistory";


export class SaveManager {
  private static settings: PlayerSettings = DEFAULT_SETTINGS;
  private static animeProgress: Record<string, AnimeSaveData> = {};
  private static history: string[] = [];

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

      const savedHistory = localStorage.getItem(this.STORAGE_KEY);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory) || [];
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
    console.log(this.history);
  }

  static getHistory(): string[] {
    return this.history;
  }
}
