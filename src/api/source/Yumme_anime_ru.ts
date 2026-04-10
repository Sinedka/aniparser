import { AnimeResult, SearchResult, FeedResponse, SearchInput } from "./yummi_anime_types";
import { create } from 'zustand'
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface ApiResponse<T> {
  response: T;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function merge<T>(a: T, b: Partial<T>): T {
  const result = { ...a };

  console.log(a, b);

  for (const key in b) {
    const bValue = b[key];
    const aValue = (a as any)[key];

    if (bValue === undefined) {
      continue;
    }

    if (isObject(aValue) && isObject(bValue)) {
      (result as any)[key] = merge(aValue, bValue);
    } else {
      (result as any)[key] = bValue;
    }
  }

  return result;
}

export class Error {
  code: number;
  message: string;

  constructor(code?: number, message?: string) {
    this.code = code || 0;
    this.message = message || '';
  }
}

const loading = new Error(1, "Loading");

function errorFromUnknown(err: unknown): Error {
  if (err instanceof globalThis.Error) {
    return new Error(0, err.message);
  }

  if (isObject(err)) {
    const code = typeof err.code === "number" ? err.code : 0;
    const message =
      typeof err.message === "string" ? err.message : "Unknown error";
    return new Error(code, message);
  }

  return new Error(0, String(err));
}

type AnimeState = {
  Anime: Record<string, AnimeResult>
  setAnime: (anime: any) => void;
}

const useAnimeStore = create<AnimeState>((set) => ({
  Anime: {},
  setAnime: (anime: AnimeResult) =>
    set((state) => ({
      Anime: {
        ...state.Anime,
        [anime.anime_id]: state.Anime[anime.anime_id] ? merge<AnimeResult>(state.Anime[anime.anime_id], anime) : anime,
      },
    })),
}));

export function useAnime(id: string): [Error, AnimeResult] {
  const anime = useAnimeStore((state) => state.Anime[id]);
  const [status, setStatus] = useState(loading);

  useEffect(() => {
    getAnime(id).then((data) => {
      if (data instanceof Error) {
        setStatus(data);
        return;
      }

      setStatus(new Error());
      useAnimeStore.getState().setAnime(data);
    });
  }, [id])

  return [status, anime];
}
export function useSearch(input: SearchInput) {
  const [search, setSearch] = useState<SearchResult[] | Error>(loading);
  useEffect(() => {
    searchTitles(input).then(data => {
      setSearch(data);
    });
  }, [input])

  return [search];
}

export function useFeed(): [Error, FeedResponse | undefined] {
  const [feed, setFeed] = useState<FeedResponse | undefined>(undefined);
  const [error, setError] = useState<Error>(loading);
  useEffect(() => {
    getFeed().then(data => {
      if (data instanceof Error) {
        setError(data);
        return
      }
      for (let i = 0; i < data.new.length; i++) {
        useAnimeStore.getState().setAnime(data.new[i]);
      }
      setFeed(data);
      setError(new Error());
    });
  }, [])
  return [error, feed];
}

export function useAnimeCluster(
  ids: string[],
  pageSize: number
): [Error | null, { pages: Array<AnimeResult[]> }, () => void] {

  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(0);
  const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());

  // берём ВСЕ доступные аниме из стора
  const animes = useAnimeStore(
    useShallow((state) =>
      ids.map((id) => state.Anime[id]).filter(Boolean)
    )
  );

  // формируем страницы из стора
  const pages = useMemo(() => {
    const result: AnimeResult[][] = [];

    for (let i = 0; i < animes.length; i += pageSize) {
      result.push(animes.slice(i, i + pageSize));
    }

    return result;
  }, [animes, pageSize]);

  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      if (loadingPages.has(page)) return;

      const start = page * pageSize;
      const end = start + pageSize;

      const pageIds = ids.slice(start, end);

      try {
        setLoadingPages((prev) => new Set(prev).add(page));
        setError(null);

        await searchTitles({
          ids: pageIds.map((id) => parseInt(id)),
        });

        if (cancelled) return;

      } catch (err) {
        if (!cancelled) {
          setError(errorFromUnknown(err));
        }
      } finally {
        if (!cancelled) {
          setLoadingPages((prev) => {
            const next = new Set(prev);
            next.delete(page);
            return next;
          });
        }
      }
    };

    if (ids.length) {
      loadPage();
    }

    return () => {
      cancelled = true;
    };
  }, [page, ids, pageSize]);

  const fetchNextPage = () => {
    setPage((prev) => prev + 1);
  };

  // возвращаем только нужное количество страниц
  const visiblePages = pages.slice(0, page + 1);

  return [error, { pages: visiblePages }, fetchNextPage];
}

const BASE_URL = "https://api.yani.tv/";

async function apiRequest<T>(
  apiMethod: string,
  params: Record<string, any> = {}
): Promise<T> {
  const url = new URL(BASE_URL + apiMethod);

  if (Object.keys(params).length) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Lang: "ru",
      },
    });

    if (!response.ok) {
      throw new Error(response.status, response.statusText || "Request failed");
    }

    const data = (await response.json()) as unknown;

    if (isObject(data) && "error" in data && data.error) {
      if (typeof data.error === "string") {
        throw new Error(0, data.error);
      }
      if (isObject(data.error)) {
        const code =
          typeof data.error.code === "number" ? data.error.code : 0;
        const message =
          typeof data.error.message === "string"
            ? data.error.message
            : "API error";
        throw new Error(code, message);
      }
      throw new Error(0, "API error");
    }

    console.log(data);

    return data as T;
  } catch (err) {
    throw errorFromUnknown(err);
  }
}

async function getAnime(
  aliasOrId: string | number,
  needVideos = false,
  options: Record<string, any> = {}
): Promise<AnimeResult | Error> {
  const params = { need_videos: needVideos, ...options };

  try {
    const response = await apiRequest<ApiResponse<AnimeResult>>(
      `anime/${aliasOrId}`,
      params
    );
    return response.response ?? new Error(2, "Empty API response");
  } catch (err) {
    return errorFromUnknown(err);
  }
}

async function searchTitles(
  input: SearchInput,
): Promise<SearchResult[]> {
  const response = await apiRequest<ApiResponse<SearchResult[]>>(
    "anime",
    input
  );


  const ans = response.response;
  ans.map((item) => {
    useAnimeStore.getState().setAnime(item);
  })

  return ans;
}

async function getFeed(
  watches: string[] = [],
  options: Record<string, any> = {}
): Promise<FeedResponse | Error> {
  const params = { watches, ...options };
  try {
    const response = await apiRequest<ApiResponse<FeedResponse>>(
      "feed",
      params
    );
    return response.response;
  }
  catch (err) {
    return errorFromUnknown(err);
  }
}
