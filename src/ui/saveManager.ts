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

export class SaveManager {
  private static settings: PlayerSettings = DEFAULT_SETTINGS;
  private static animeProgress: Record<string, AnimeSaveData> = {};

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
    this.animeProgress[url] = data;
    try {
      localStorage.setItem(
        ANIME_PROGRESS_KEY,
        JSON.stringify(this.animeProgress)
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
        JSON.stringify(this.animeProgress)
      );
    } catch (error) {
      console.error("Error clearing anime progress:", error);
    }
  }
}
