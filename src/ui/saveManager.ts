import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlayerSettings {
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  showRemainingTime: boolean;
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
  showRemainingTime: false,
};

const SETTINGS_KEY = "player_settings";
const ANIME_PROGRESS_KEY = "anime_progress";
const HISTORY_KEY = "animeHistory";
const FAVOURITES_KEY = "favourites_list";
const ANIME_STATUS_KEY = "anime_status";

type SettingsStore = {
  settings: PlayerSettings;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (isMuted: boolean) => void;
  setShowRemainingTime: (showRemainingTime: boolean) => void;
};

type ProgressStore = {
  animeProgress: Record<string, AnimeSaveData>;
  saveAnimeProgress: (url: string, data: AnimeSaveData) => void;
  clearAnimeProgress: (url: string) => void;
};

type HistoryStore = {
  history: string[];
  saveAnimeToHistory: (url: string) => void;
};

type FavouritesStore = {
  favourites: string[];
  addAnimeToFavourites: (url: string) => void;
  removeAnimeFromFavourites: (url: string) => void;
};

type StatusStore = {
  animeStatus: Record<string, number>;
  setAnimeStatus: (url: string, status: number) => void;
};

const loadLegacyState = () => {
  if (typeof window === "undefined") return {};
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    const savedProgress = localStorage.getItem(ANIME_PROGRESS_KEY);
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    const savedFavourites = localStorage.getItem(FAVOURITES_KEY);
    const savedAnimeStatus = localStorage.getItem(ANIME_STATUS_KEY);
    return {
      settings: savedSettings
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }
        : undefined,
      animeProgress: savedProgress ? JSON.parse(savedProgress) : undefined,
      history: savedHistory ? JSON.parse(savedHistory) || [] : undefined,
      favourites: savedFavourites ? JSON.parse(savedFavourites) || [] : undefined,
      animeStatus: savedAnimeStatus ? JSON.parse(savedAnimeStatus) : undefined,
    };
  } catch (error) {
    console.error("Error loading saved data:", error);
    return {};
  }
};

const legacyState = loadLegacyState();

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: legacyState.settings ?? DEFAULT_SETTINGS,
      setPlaybackSpeed: (speed) =>
        set((state) => ({ settings: { ...state.settings, playbackSpeed: speed } })),
      setVolume: (volume) =>
        set((state) => ({ settings: { ...state.settings, volume } })),
      setMuted: (isMuted) =>
        set((state) => ({ settings: { ...state.settings, isMuted } })),
      setShowRemainingTime: (showRemainingTime) =>
        set((state) => ({ settings: { ...state.settings, showRemainingTime } })),
    }),
    { name: "save_settings" },
  ),
);

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      animeProgress: legacyState.animeProgress ?? {},
      saveAnimeProgress: (url, data) =>
        set((state) => ({
          animeProgress: { ...state.animeProgress, [url]: data },
        })),
      clearAnimeProgress: (url) =>
        set((state) => {
          const next = { ...state.animeProgress };
          delete next[url];
          return { animeProgress: next };
        }),
    }),
    { name: "save_progress" },
  ),
);

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      history: legacyState.history ?? [],
      saveAnimeToHistory: (url) =>
        set((state) => {
          const next = state.history.filter((item) => item !== url);
          next.unshift(url);
          return { history: next };
        }),
    }),
    { name: "save_history" },
  ),
);

export const useFavouritesStore = create<FavouritesStore>()(
  persist(
    (set) => ({
      favourites: legacyState.favourites ?? [],
      addAnimeToFavourites: (url) =>
        set((state) => {
          const next = state.favourites.filter((item) => item !== url);
          next.unshift(url);
          return { favourites: next };
        }),
      removeAnimeFromFavourites: (url) =>
        set((state) => ({
          favourites: state.favourites.filter((item) => item !== url),
        })),
    }),
    { name: "save_favourites" },
  ),
);

export const useStatusStore = create<StatusStore>()(
  persist(
    (set) => ({
      animeStatus: legacyState.animeStatus ?? {},
      setAnimeStatus: (url, status) =>
        set((state) => {
          const next = { ...state.animeStatus };
          if (status === 0) delete next[url];
          else next[url] = status;
          return { animeStatus: next };
        }),
    }),
    { name: "save_status" },
  ),
);

export type { AnimeSaveData, PlayerSettings };
