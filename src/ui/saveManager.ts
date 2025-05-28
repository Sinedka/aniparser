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

const DEFAULT_ANIME_PROGRESS: AnimeSaveData = {
  player: 0,
  dubber: 0,
  episode: 0,
  time: 0,
};

const SETTINGS_KEY = "player_settings";
const ANIME_PROGRESS_KEY = "anime_progress";

export class SaveManager {
  private static settings: PlayerSettings = DEFAULT_SETTINGS;
  private static animeProgress: Record<string, AnimeSaveData> = {};

  static initialize(): void {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } catch {
        this.settings = DEFAULT_SETTINGS;
      }
    }

    const savedProgress = localStorage.getItem(ANIME_PROGRESS_KEY);
    if (savedProgress) {
      try {
        this.animeProgress = JSON.parse(savedProgress);
      } catch {
        this.animeProgress = {};
      }
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

  static getAnimeProgress(url: string): AnimeSaveData | null {
    return this.animeProgress[url] || DEFAULT_ANIME_PROGRESS;
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
