import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { findExtractor, extractVideos } from "../players/index";
import {
  AnimeStatus,
  AnimeType,
  MinAge,
  Poster,
  Rating,
  VideoInfo,
  RemoteIds,
  Creator,
  Studio,
  Episodes,
  Genre,
  Translates,
  ViewingOrder,
  RandomScreenshot,
  Top,
  Dubber,
} from "./yummi_anime_types";

interface ApiResponse<T> {
  response: T;
}

interface Source {
  title: string;
  url: string;
}
interface Player {
  name: string;
  dubbers: Dubber[];
}
interface EpisodeData {
  title: string;
  num: number;
  videos: VideoInfo[];
}

interface SearchResult {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  description: string;
  min_age: MinAge;
  poster: Poster;
  rating: Rating;
  remote_ids: RemoteIds;
  season: number;
  title: string;
  top: Top;
  type: AnimeType;
  views: number;
  year: number;
}

interface OngoingResult {
  title: string;
  description: string;
  poster: Poster;
  anime_url: string;
  anime_id: number;
  episodes: Episodes;
}

interface AnimeResult {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  poster: Poster;
  rating: Rating;
  title: string;
  type: AnimeType;
  year: number;
  description: string;
  views: number;
  season: number;
  min_age: MinAge;
  remote_ids: RemoteIds;
  original: string;
  other_titles: string[];
  creators: Creator[];
  studios: Studio[];
  videos: VideoInfo[];
  genres: Genre[];
  viewing_order: ViewingOrder[];
  translates: Translates[];
  blocked_in: string[];
  episodes: Episodes;
  comments_count: number;
  reviews_count: number;
  random_screenshots: RandomScreenshot[];
  top: Top;
  posts_count: number;
}

class YummyAnimeRuAPI {
  private BASE_URL = "https://api.yani.tv/";

  async apiRequest<T>(
    apiMethod: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const url = new URL(this.BASE_URL + apiMethod);

    if (Object.keys(params).length) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Lang: "ru",
      },
    });

    return (await response.json()) as T;
  }

  async getAnime(
    aliasOrId: string | number,
    needVideos = true,
    options: Record<string, any> = {}
  ): Promise<AnimeResult> {
    const params = { need_videos: needVideos, ...options };
    const response = await this.apiRequest<ApiResponse<AnimeResult>>(
      `anime/${aliasOrId}`,
      params
    );
    return response.response;
  }

  async searchTitles(
    search: string,
    limit = 20,
    offset = 0,
    options: Record<string, any> = {}
  ): Promise<SearchResult[]> {
    const params = { q: search, limit, offset, ...options };
    const response = await this.apiRequest<ApiResponse<SearchResult[]>>(
      "search",
      params
    );
    return response.response;
  }

  async getUpdates(
    options: Record<string, any> = {}
  ): Promise<OngoingResult[]> {
    const response = await this.apiRequest<ApiResponse<OngoingResult[]>>(
      "anime/schedule",
      options
    );
    return response.response;
  }
}

const api = new YummyAnimeRuAPI();

export const yummyKeys = {
  all: ["yummy-anime"] as const,
  anime: (aliasOrId: string | number) =>
    [...yummyKeys.all, "anime", aliasOrId] as const,
  search: (query: string, limit: number, offset: number) =>
    [...yummyKeys.all, "search", query, limit, offset] as const,
  ongoings: () => [...yummyKeys.all, "ongoings"] as const,
  animeList: (urls: string[], pageSize: number) =>
    [...yummyKeys.all, "anime-list", urls, pageSize] as const,
};

export async function fetchAnime(
  aliasOrId: string | number,
  needVideos = true,
  options: Record<string, any> = {}
): Promise<Anime> {
  return new Anime(await api.getAnime(aliasOrId, needVideos, options));
}

export async function fetchSearch(
  query: string,
  limit = 20,
  offset = 0,
  options: Record<string, any> = {}
): Promise<Search[]> {
  return (await api.searchTitles(query, limit, offset, options)).map(
    (result) => new Search(result)
  );
}

export async function fetchOngoings(
  options: Record<string, any> = {}
): Promise<Ongoing[]> {
  const updates = await api.getUpdates(options);
  return updates
    .filter((item) => item.episodes.aired > 0)
    .map((item) => new Ongoing(item));
}

export function useAnimeQuery(
  url: string | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: yummyKeys.anime(url ?? ""),
    queryFn: () => fetchAnime(url as string),
    enabled: (options.enabled ?? true) && !!url,
  });
}

export function useSearchQuery(
  query: string,
  options: { enabled?: boolean; limit?: number; offset?: number } = {}
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  return useQuery({
    queryKey: yummyKeys.search(query, limit, offset),
    queryFn: () => fetchSearch(query, limit, offset),
    enabled: (options.enabled ?? true) && query.trim().length > 0,
  });
}

export function useOngoingsQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: yummyKeys.ongoings(),
    queryFn: () => fetchOngoings(),
    enabled: options.enabled ?? true,
  });
}

export function useAnimeListInfiniteQuery(urls: string[], pageSize = 10) {
  return useInfiniteQuery({
    queryKey: yummyKeys.animeList(urls, pageSize),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const start = pageParam as number;
      const slice = urls.slice(start, start + pageSize);
      const results = await Promise.all(slice.map((url) => fetchAnime(url)));
      return results;
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.length, 0);
      return loaded < urls.length ? loaded : undefined;
    },
    enabled: urls.length > 0,
  });
}

// Основные классы
export class Search {
  public searchResult: SearchResult;

  constructor(searchResult: SearchResult) {
    this.searchResult = searchResult;
  }

  async getAnime(): Promise<Anime> {
    return new Anime(
      await new YummyAnimeRuAPI().getAnime(this.searchResult.anime_id)
    );
  }
}

export class Ongoing {
  public ongoingResult: OngoingResult;

  constructor(ongoingResult: OngoingResult) {
    this.ongoingResult = ongoingResult;
  }

  async getAnime(): Promise<Anime> {
    return new Anime(
      await new YummyAnimeRuAPI().getAnime(this.ongoingResult.anime_id)
    );
  }
}

export class Anime {
  public animeResult: AnimeResult;
  public players: Player[];
  constructor(animeResult: AnimeResult) {
    this.animeResult = animeResult;
    this.players = this.getPlayers();
  }

  getPlayers(): Player[] {
    const t: Record<string, Player> = {};
    this.animeResult.videos.forEach((video) => {
      if (video.iframe_url.startsWith("//"))
        video.iframe_url = "https:" + video.iframe_url;

      if (typeof findExtractor(video.iframe_url) == "undefined") return;

      if (!t[video.data.player]) {
        t[video.data.player] = {
          name: video.data.player,
          dubbers: [],
        };
      }
      var dubberNow = t[video.data.player].dubbers.find(
        (d) => d.dubbing === video.data.dubbing
      );
      if (!dubberNow) {
        dubberNow = {
          dubbing: video.data.dubbing,
          player: video.data.player,
          episodes: [],
        };

        t[video.data.player].dubbers.push(dubberNow);
      }
      t[video.data.player].dubbers.forEach((d) => {
        if (d.dubbing === video.data.dubbing) {
          d.episodes.push(new Video(video));
        }
      });
    });
    const ans = Object.values(t);
    ans.forEach((player) => {
      player.dubbers.forEach((dubber) => {
        dubber.episodes.sort((a, b) => {
          return Number(a.video.number) - Number(b.video.number);
        });
      });
    });
    return ans;
  }
}

export class Video {
  public video: VideoInfo;

  constructor(video: VideoInfo) {
    this.video = video;
  }

  async getSources(): Promise<Source[]> {
    return (await extractVideos(this.video.iframe_url)).map((video) => ({
      title: video.quality.toString(),
      url: video.url,
    }));
  }
}

export class YummyAnimeExtractor {
  // BASE_URL: string;
  private api: YummyAnimeRuAPI;

  constructor() {
    // this.BASE_URL = "https://yummy-anime.ru/catalog/item/";
    this.api = new YummyAnimeRuAPI();
  }

  async Search(query: string): Promise<Search[]> {
    return (await this.api.searchTitles(query)).map(
      (result) => new Search(result)
    );
  }

  async getOngoings(): Promise<Ongoing[]> {
    const updates = await this.api.getUpdates();

    return updates
      .filter((item) => item.episodes.aired > 0)
      .map((item) => new Ongoing(item));
  }

  async getAnime(url: string): Promise<Anime> {
    // Извлекаем ID аниме из URL
    return new Anime(await this.api.getAnime(url));
  }
}
