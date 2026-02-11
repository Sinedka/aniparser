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

interface FeedRating {
  counters: number;
  average: number;
}

interface FeedMinAge {
  value: number;
  title: string;
  title_long: string;
}

interface FeedUserListInfo {
  title: string;
  href: string;
  id: number;
}

interface FeedUserList {
  is_fav: boolean;
  list?: FeedUserListInfo;
}

interface FeedUser {
  list?: FeedUserList;
  rating?: number;
}

interface FeedRemoteIds {
  worldart_id: number;
  worldart_type: string;
  kp_id: number;
  anidub_id: number;
  sr_id: number;
  anilibria_alias: string;
  shikimori_id: number;
  myanimelist_id: number;
}

interface FeedAnimeItem {
  anime_id: number;
  anime_status: AnimeStatus;
  anime_url: string;
  poster: Poster;
  rating: FeedRating;
  title: string;
  type: AnimeType;
  year: number;
  description: string;
  views: number;
  season: number;
  min_age: FeedMinAge;
  user?: FeedUser;
  remote_ids: FeedRemoteIds;
  top: Top;
  blocked_in: string[];
}

interface FeedVideoItem {
  title: string;
  date: number;
  description: string;
  ep_title: string;
  player_title: string;
  poster: Poster;
  anime_url: string;
  dub_title: string;
  anime_id: number;
  video_id: number;
}

interface FeedTopCarousel {
  season: number;
  year: number;
  items: FeedAnimeItem[];
}

interface FeedLastWatchScreenshot {
  id: number;
  time: number;
  episode: string;
  sizes: {
    small: string;
    full: string;
  };
}

interface FeedLastWatchItem {
  date: number;
  end_time: number;
  anime_url: string;
  poster: Poster;
  video_id: number;
  description: string;
  title: string;
  anime_id: number;
  do_not_recommend: boolean;
  ep_title: string;
  duration: number;
  screenshot: FeedLastWatchScreenshot;
}

interface FeedScheduleEpisodes {
  aired: number;
  count: number;
  next_date: number;
  prev_date: number;
}

interface FeedScheduleItem {
  title: string;
  description: string;
  poster: Poster;
  anime_url: string;
  anime_id: number;
  episodes: FeedScheduleEpisodes;
}

interface FeedUserIds {
  shikimori?: {
    id: number;
    nickname: string;
  };
  tg_nickname?: string;
  vk?: number;
}

interface FeedUserAvatars {
  big: string;
  full: string;
  small: string;
}

interface FeedUserBanner {
  cropped: string;
  full: string;
}

interface FeedUserTexts {
  color: number;
  left: string;
  right: string;
}

interface FeedUserProfile {
  id: number;
  nickname: string;
  about: string;
  banned: boolean;
  ids: FeedUserIds;
  avatars: FeedUserAvatars;
  bdate: number;
  last_online: number;
  sex: number;
  roles: string[];
  register_date: number;
  texts: FeedUserTexts;
  banner: FeedUserBanner;
}

interface FeedPostCategory {
  id: number;
  title: string;
  uri: string;
}

interface FeedPostItem {
  title: string;
  preview_image: string;
  id: number;
  content_preview: string;
  user: FeedUserProfile;
  category: FeedPostCategory;
  created_at: number;
}

interface FeedPostType {
  title: string;
  id: number;
  uri: string;
}

interface FeedPosts {
  items: FeedPostItem[];
  types: FeedPostType[];
}

interface FeedBloggerCategory {
  id: string;
  title: string;
}

interface FeedBloggerVideoDescriptions {
  big: string;
  small: string;
}

interface FeedBloggerVideoPreviews {
  small: string;
  big: string;
}

interface FeedBloggerVideoLikes {
  likes: number;
  dislikes: number;
  vote: number;
}

interface FeedBloggerVideoItem {
  title: string;
  id: number;
  time: number;
  category: FeedBloggerCategory;
  publish_date: number;
  iframe_url: string;
  has_spoiler: boolean;
  descriptions: FeedBloggerVideoDescriptions;
  comments_count: number;
  creator: FeedUserProfile;
  previews: FeedBloggerVideoPreviews;
  likes: FeedBloggerVideoLikes;
  views: number;
  language: string;
}

interface FeedBloggerVideos {
  items: FeedBloggerVideoItem[];
  categories: FeedBloggerCategory[];
}

interface FeedBloggerPeople {
  items: FeedUserProfile[];
  count: number;
}

interface FeedBlogger {
  videos: FeedBloggerVideos;
  people: FeedBloggerPeople;
}

interface FeedCollectionLikes {
  likes: number;
  dislikes: number;
  vote: number;
}

interface FeedCollectionOwner {
  id: number;
  nickname: string;
  avatars: FeedUserAvatars;
}

interface FeedCollection {
  title: string;
  description: string;
  id: number;
  likes: FeedCollectionLikes;
  language: string;
  animes: FeedAnimeItem[];
  owner: FeedCollectionOwner;
  create_date: number;
  views: number;
  public: boolean;
  poster_previews: Poster[];
}

export interface FeedResponse {
  new: FeedAnimeItem[];
  announcements: FeedAnimeItem[];
  recommends: FeedAnimeItem[];
  new_videos: FeedVideoItem[];
  top_carousel: FeedTopCarousel;
  last_watches: FeedLastWatchItem[];
  schedule: FeedScheduleItem[];
  posts: FeedPosts;
  blogger: FeedBlogger;
  collections: FeedCollection[];
}

export interface SearchResult {
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

export interface OngoingResult {
  title: string;
  description: string;
  poster: Poster;
  anime_url: string;
  anime_id: number;
  episodes: Episodes;
}

export interface AnimeResult {
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

  async getFeed(
    watches: string[] = [],
    options: Record<string, any> = {}
  ): Promise<FeedResponse> {
    const params = { watches, ...options };
    const response = await this.apiRequest<ApiResponse<FeedResponse>>(
      "feed",
      params
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
  feed: (watches: string[]) => [...yummyKeys.all, "feed", watches] as const,
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

export async function fetchFeed(
  watches: string[] = [],
  options: Record<string, any> = {}
): Promise<FeedResponse> {
  return api.getFeed(watches, options);
}

export function useAnimeQuery(
  url: string | null,
  options: { enabled?: boolean; initialData?: Anime } = {}
) {
  return useQuery({
    queryKey: yummyKeys.anime(url ?? ""),
    queryFn: () => fetchAnime(url as string),
    enabled: (options.enabled ?? true) && !!url,
    initialData: options.initialData,
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

export function useFeedQuery(
  watches: string[] = [],
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: yummyKeys.feed(watches),
    queryFn: () => fetchFeed(watches),
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

export type AnimeSeed = Partial<
  Pick<
    AnimeResult,
    | "anime_url"
    | "title"
    | "poster"
    | "description"
    | "anime_status"
    | "type"
    | "year"
    | "rating"
    | "genres"
  >
> &
  Pick<AnimeResult, "anime_url" | "title" | "poster">;

export function seedFromSearch(search: Search): AnimeSeed {
  const result = search.searchResult;
  return {
    anime_url: result.anime_url,
    title: result.title,
    poster: result.poster,
    description: result.description,
    anime_status: result.anime_status,
    type: result.type,
    year: result.year,
    rating: result.rating,
  };
}

export function seedFromOngoing(ongoing: Ongoing): AnimeSeed {
  const result = ongoing.ongoingResult;
  return {
    anime_url: result.anime_url,
    title: result.title,
    poster: result.poster,
    description: result.description,
  };
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
