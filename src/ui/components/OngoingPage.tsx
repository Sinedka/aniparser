import "./OngoingPage.css";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AnimeSeed,
  FeedResponse,
  useAnimeListInfiniteQuery,
  useFeedQuery,
} from "../../api/source/Yumme_anime_ru";
import { useHistoryStore, useStatusStore } from "../saveManager";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import PosterFrame from "./PosterFrame";

type FeedAnimeItem = FeedResponse["new"][number];
type FeedCardItem = Pick<
  FeedAnimeItem,
  "title" | "poster" | "anime_status" | "type" | "year" | "description" | "rating"
>;
type FeedScheduleItem = FeedResponse["schedule"][number];

const ESTIMATED_SCHEDULE_CARD_HEIGHT = 360;
const SCHEDULE_GRID_GAP = 18;
const SCHEDULE_HEADER_HEIGHT = 56;
const SCHEDULE_GRID_MIN_COL_WIDTH = 500;

const statusKeyFromValue = (value: number) =>
  value === 1
    ? "planned"
    : value === 2
      ? "watching"
      : value === 3
        ? "completed"
        : value === 5
          ? "dropped"
          : undefined;

type DeferredSectionProps = {
  estimatedHeight: number;
  children: React.ReactNode;
};

const DeferredSection: React.FC<DeferredSectionProps> = ({ estimatedHeight, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isVisible) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <div
      ref={ref}
      style={!isVisible ? { minHeight: `${estimatedHeight}px` } : undefined}
    >
      {isVisible ? children : null}
    </div>
  );
};

function seedFromFeed(item: FeedAnimeItem): AnimeSeed {
  return {
    anime_url: item.anime_url,
    title: item.title,
    poster: item.poster,
    description: item.description,
    anime_status: item.anime_status,
    type: item.type,
    year: item.year,
    rating: {
      average: item.rating?.average ?? 0,
      counters: item.rating?.counters ?? 0,
      kp_rating: 0,
      anidub_rating: 0,
      myanimelist_rating: 0,
      shikimori_rating: 0,
      worldart_rating: 0,
    },
  };
}

function seedFromSchedule(item: FeedScheduleItem): AnimeSeed {
  return {
    anime_url: item.anime_url,
    title: item.title,
    poster: item.poster,
    description: item.description,
  };
}

const FeedAnimeCardView = React.memo(function FeedAnimeCardView({
  item,
  showDescription,
}: {
  item: FeedCardItem;
  showDescription: boolean;
}) {
  const posterUrl = !item.poster.huge.startsWith("http")
    ? `https:${item.poster.huge}`
    : item.poster.huge;
  const statusValue = useStatusStore(
    (state) => state.animeStatus[item.anime_url] ?? 0,
  );
  const statusKey = statusKeyFromValue(statusValue);

  return (
    <article className="feed-card">
      <PosterFrame
        className="feed-card-media"
        status={statusKey}
        src={posterUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
      >
        <div
          className="feed-card-status"
          data-status={item.anime_status?.title}
        >
          {item.anime_status?.title}
        </div>
      </PosterFrame>
      <div className="feed-card-body">
        <h3 className="feed-card-title">{item.title}</h3>
        {showDescription && <p className="feed-card-desc">{item.description}</p>}
        <div className="feed-card-footer">
          <div className="feed-card-meta">
            <span>{item.type?.name}</span>
            <span>{item.year}</span>
          </div>
          <div className="feed-card-rating">
            ★ {item.rating?.average?.toFixed(2) ?? "0.00"} ·{" "}
            {item.rating?.counters ?? 0}
          </div>
        </div>
      </div>
    </article>
  );
});

function FeedAnimeCard(item: FeedCardItem, options?: { showDescription?: boolean }) {
  const showDescription = options?.showDescription ?? true;
  return <FeedAnimeCardView item={item} showDescription={showDescription} />;
}

const ScheduleCard = React.memo(function ScheduleCard({
  item,
  onClick,
}: {
  item: FeedScheduleItem;
  onClick: () => void;
}) {
  const statusValue = useStatusStore(
    (state) => state.animeStatus[item.anime_url] ?? 0,
  );
  const statusKey = statusKeyFromValue(statusValue);
  return (
    <article className="schedule-card" onClick={onClick}>
      <PosterFrame
        className="schedule-media"
        status={statusKey}
        src={
          item.poster.huge.startsWith("http")
            ? item.poster.huge
            : `https:${item.poster.huge}`
        }
        alt={item.title}
        loading="lazy"
        decoding="async"
      >
        <div className="schedule-badge">
          {item.episodes.aired} / {item.episodes.count || "?"}
        </div>
      </PosterFrame>
      <div className="schedule-body">
        <h3 className="schedule-card-title">{item.title}</h3>
        <p className="schedule-card-desc">{item.description}</p>
        <div className="schedule-meta">
          <div className="schedule-meta-item">
            <span className="schedule-meta-label">След. серия</span>
            <span className="schedule-meta-value">
              {formatScheduleDate(item.episodes.next_date)}
            </span>
          </div>
          <div className="schedule-meta-item">
            <span className="schedule-meta-label">Прош. серия</span>
            <span className="schedule-meta-value">
              {formatScheduleDate(item.episodes.prev_date)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});

const ScheduleDay = React.memo(function ScheduleDay({
  dayKey,
  items,
  labelSource,
  onNavigate,
}: {
  dayKey: string;
  items: FeedScheduleItem[];
  labelSource?: number;
  onNavigate: (item: FeedScheduleItem) => void;
}) {
  return (
    <div className="schedule-day">
      <h3 className="schedule-day-title">{formatScheduleDayLabel(labelSource)}</h3>
      <div className="schedule-grid">
        {items.map((item, i) => (
          <ScheduleCard
            key={`${dayKey}-${i}`}
            item={item}
            onClick={() => onNavigate(item)}
          />
        ))}
      </div>
    </div>
  );
});

function formatScheduleDate(ts?: number) {
  if (!ts) return "—";
  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return scheduleDateFormatter.format(date);
}

function getScheduleDayKey(ts?: number) {
  if (!ts) return "no-date";
  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime())) return "no-date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatScheduleDayLabel(ts?: number) {
  if (!ts) return "Без даты";
  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime())) return "Без даты";
  return scheduleDayFormatter.format(date);
}

function SkeletonPlate(baseColor: string, highlightColor: string) {
  return (
    <div className="anime-plate">
      <div className="thumbnail">
        <div className="poster-skeleton">
          <Skeleton
            height="100%"
            width="100%"
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
      </div>
      <div className="anime-data">
        <Skeleton
          width="70%"
          height={22}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
        <div className="small-info">
          <Skeleton
            width={90}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={80}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
          <Skeleton
            width={60}
            height={20}
            baseColor={baseColor}
            highlightColor={highlightColor}
          />
        </div>
        <Skeleton
          count={3}
          height={14}
          baseColor={baseColor}
          highlightColor={highlightColor}
        />
      </div>
    </div>
  );
}

const scheduleDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const scheduleDayFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export default function MainPage() {
  const historyUrls = useHistoryStore((state) => state.history);
  const navigate = useNavigate();
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";
  const historyShelfRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  const {
    data: feed,
    isLoading: isFeedLoading,
    isError: isFeedError,
  } = useFeedQuery();

  const {
    data: historyPages,
    isLoading: isHistoryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeListInfiniteQuery(historyUrls, 12);

  const historyAnimes = useMemo(
    () => historyPages?.pages.flat() ?? [],
    [historyPages],
  );
  const scheduleGroups = useMemo(() => {
    const schedule = feed?.schedule ?? [];
    if (!schedule.length) return [];
    const groups = schedule.reduce(
      (acc, item) => {
        const key = getScheduleDayKey(item.episodes.next_date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, FeedScheduleItem[]>,
    );
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [feed?.schedule]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const estimateScheduleHeight = useCallback(
    (itemsCount: number) => {
      const width = Math.max(0, viewportWidth - 64);
      const columns = Math.max(
        1,
        Math.floor(width / SCHEDULE_GRID_MIN_COL_WIDTH),
      );
      const rows = Math.max(1, Math.ceil(itemsCount / columns));
      return (
        SCHEDULE_HEADER_HEIGHT +
        rows * ESTIMATED_SCHEDULE_CARD_HEIGHT +
        Math.max(0, rows - 1) * SCHEDULE_GRID_GAP
      );
    },
    [viewportWidth],
  );


  if (isFeedLoading) {
    return (
      <>
        {historyUrls.length > 0 && (
          <section className="feed-section">
            <div className="feed-section-header">
              <h2 className="feed-section-title">Продолжение просмотра</h2>
            </div>
            <div className="history-shelf-wrap">
              <div className="history-shelf">
                <div className="feed-shelf">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`history-loading-${i}`} className="feed-card-wrapper">
                      <div className="feed-card">
                        <div className="feed-card-media">
                          <Skeleton
                            height="100%"
                            width="100%"
                            baseColor={skeletonBase}
                            highlightColor={skeletonHighlight}
                          />
                        </div>
                        <div className="feed-card-body">
                          <Skeleton
                            width="80%"
                            height={18}
                            baseColor={skeletonBase}
                            highlightColor={skeletonHighlight}
                          />
                          <Skeleton
                            count={2}
                            height={12}
                            baseColor={skeletonBase}
                            highlightColor={skeletonHighlight}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="history-arrow history-arrow-left"
                disabled
                aria-label="Прокрутить историю влево"
              >
                ‹
              </button>
              <button
                className="history-arrow history-arrow-right"
                disabled
                aria-label="Прокрутить историю вправо"
              >
                ›
              </button>
            </div>
          </section>
        )}
        <section className="schedule-section">
          <div className="schedule-header">
            <h2 className="schedule-title">Расписание выхода</h2>
            <p className="schedule-subtitle">Следующие эпизоды и актуальные даты</p>
          </div>
          <div className="schedule-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`schedule-skeleton-${i}`} className="schedule-card">
                <div className="schedule-media">
                  <Skeleton
                    height="100%"
                    width="100%"
                    baseColor={skeletonBase}
                    highlightColor={skeletonHighlight}
                  />
                </div>
                <div className="schedule-body">
                  <Skeleton
                    width="70%"
                    height={20}
                    baseColor={skeletonBase}
                    highlightColor={skeletonHighlight}
                  />
                  <Skeleton
                    count={2}
                    height={12}
                    baseColor={skeletonBase}
                    highlightColor={skeletonHighlight}
                  />
                  <div className="schedule-meta">
                    <Skeleton
                      width={120}
                      height={14}
                      baseColor={skeletonBase}
                      highlightColor={skeletonHighlight}
                    />
                    <Skeleton
                      width={120}
                      height={14}
                      baseColor={skeletonBase}
                      highlightColor={skeletonHighlight}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (isFeedError) {
    return (
      <div className="error-container">
        <p className="error-text">Ошибка при загрузке данных</p>
      </div>
    );
  }

  const handleHistoryScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (!hasNextPage || isFetchingNextPage) return;
    const preloadOffset = 500;
    if (target.scrollLeft + target.clientWidth >= target.scrollWidth - preloadOffset) {
      fetchNextPage();
    }
  };
  const scrollHistoryBy = (direction: "left" | "right") => {
    const shelf = historyShelfRef.current;
    if (!shelf) return;
    const amount = Math.round(shelf.clientWidth * 0.9);
    shelf.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <>
      {historyUrls.length > 0 && isHistoryLoading && (
        <section className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">Продолжение просмотра</h2>
          </div>
          <div className="history-shelf-wrap">
            <div className="history-shelf">
              <div className="feed-shelf">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={`history-skeleton-${i}`} className="feed-card-wrapper">
                    <div className="feed-card">
                      <div className="feed-card-media">
                        <Skeleton
                          height="100%"
                          width="100%"
                          baseColor={skeletonBase}
                          highlightColor={skeletonHighlight}
                        />
                      </div>
                      <div className="feed-card-body">
                        <Skeleton
                          width="80%"
                          height={18}
                          baseColor={skeletonBase}
                          highlightColor={skeletonHighlight}
                        />
                        <Skeleton
                          count={2}
                          height={12}
                          baseColor={skeletonBase}
                          highlightColor={skeletonHighlight}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              className="history-arrow history-arrow-left"
              disabled
              aria-label="Прокрутить историю влево"
            >
              ‹
            </button>
            <button
              className="history-arrow history-arrow-right"
              disabled
              aria-label="Прокрутить историю вправо"
            >
              ›
            </button>
          </div>
        </section>
      )}
      {historyAnimes.length > 0 && (
        <section className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">Продолжение просмотра</h2>
          </div>
          <div className="history-shelf-wrap">
            <div
              className="history-shelf"
              ref={historyShelfRef}
              onScroll={handleHistoryScroll}
            >
              <div className="feed-shelf">
              {historyAnimes.map((anime, i) => (
                <div
                  key={`history-${i}`}
                  className="feed-card-wrapper"
                  onClick={() =>
                    navigate(
                      `/anime?url=${encodeURIComponent(anime.animeResult.anime_url)}`,
                      { state: { anime } }
                    )
                  }
                >
                {FeedAnimeCard(anime.animeResult, { showDescription: false })}
                </div>
              ))}
              {isFetchingNextPage && (
                <div className="feed-card-wrapper">
                  <div className="feed-card">
                    <div className="feed-card-media">
                      <Skeleton
                        height="100%"
                        width="100%"
                        baseColor={skeletonBase}
                        highlightColor={skeletonHighlight}
                      />
                    </div>
                    <div className="feed-card-body">
                      <Skeleton
                        width="80%"
                        height={18}
                        baseColor={skeletonBase}
                        highlightColor={skeletonHighlight}
                      />
                      <Skeleton
                        count={2}
                        height={12}
                        baseColor={skeletonBase}
                        highlightColor={skeletonHighlight}
                      />
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
            <button
              className="history-arrow history-arrow-left"
              onClick={() => scrollHistoryBy("left")}
              aria-label="Прокрутить историю влево"
            >
              ‹
            </button>
            <button
              className="history-arrow history-arrow-right"
              onClick={() => scrollHistoryBy("right")}
              aria-label="Прокрутить историю вправо"
            >
              ›
            </button>
          </div>
          </section>
        )}
      {(feed?.schedule?.length ?? 0) > 0 && (
        <section className="schedule-section">
          <div className="schedule-header">
            <h2 className="schedule-title">Расписание выхода</h2>
            <p className="schedule-subtitle">
              Следующие эпизоды и актуальные даты
            </p>
          </div>
          {scheduleGroups.map(([dayKey, items]) => {
            const labelSource = items[0]?.episodes.next_date;
            const estimatedHeight = estimateScheduleHeight(items.length);
            return (
              <DeferredSection key={dayKey} estimatedHeight={estimatedHeight}>
                <ScheduleDay
                  dayKey={dayKey}
                  items={items}
                  labelSource={labelSource}
                  onNavigate={(item) =>
                    navigate(
                      `/anime?url=${encodeURIComponent(item.anime_url)}`,
                      { state: { seed: seedFromSchedule(item) } },
                    )
                  }
                />
              </DeferredSection>
            );
          })}
        </section>
      )}
      {(feed?.recommends?.length ?? 0) > 0 && (
        <section className="feed-section">
          <div className="feed-section-header">
            <h2 className="feed-section-title">Рекомендуем</h2>
            <p className="feed-section-subtitle">Персональная подборка</p>
          </div>
          <div className="feed-shelf">
            {feed?.recommends.map((item, i) => (
              <div
                key={`rec-${i}`}
                className="feed-card-wrapper"
                onClick={() =>
                  navigate(
                    `/anime?url=${encodeURIComponent(item.anime_url)}`,
                    { state: { seed: seedFromFeed(item) } }
                  )
                }
              >
                {FeedAnimeCard(item)}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
