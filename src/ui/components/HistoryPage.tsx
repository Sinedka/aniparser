import { InfiniteScroll } from "./InfiniteScrol";
import { Anime, useAnimeListInfiniteQuery } from "../../api/source/Yumme_anime_ru";
import { useHistoryStore, useStatusStore } from "../saveManager";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import PosterFrame from "./PosterFrame";


function AnimePlate({
  animeData,
  onNavigate,
}: {
  animeData: Anime;
  onNavigate: (to: string, options?: { state?: unknown }) => void;
}) {
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
  const statusValue = useStatusStore(
    (state) => state.animeStatus[animeData.animeResult.anime_url] ?? 0,
  );
  const statusKey = statusKeyFromValue(statusValue);
  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        onNavigate(`/anime?url=${encodeURIComponent(animeData.animeResult.anime_url)}`, {
          state: { anime: animeData },
        })
      }
    >
      <PosterFrame
        className="thumbnail"
        status={statusKey}
        src={
          !animeData.animeResult.poster.huge.startsWith("http")
            ? `https:${animeData.animeResult.poster.huge}`
            : animeData.animeResult.poster.huge
        }
        alt={animeData.animeResult.title}
        imgClassName="thumbnail-img"
      >
      </PosterFrame>
      <div className="anime-data">
        <h3 className="title">{animeData.animeResult.title}</h3>
        <div className="small-info">
          <div
            className="small-info-el anime-status"
            data-status={animeData.animeResult.anime_status.title}
          >
            {animeData.animeResult.anime_status.title}
          </div>
          <div className="small-info-el">
            {animeData.animeResult.type.name}
          </div>
          <div className="small-info-el">{animeData.animeResult.year}</div>
        </div>

        <p className="description">{animeData.animeResult.description}</p>
      </div>
    </a>
  );
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

export default function HistoryPage() {
  const history = useHistoryStore((state) => state.history);
  const navigate = useNavigate();
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeListInfiniteQuery(history);

  if (isLoading) {
    return (
      <div>
        <h1>История просмотров</h1>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            {SkeletonPlate(skeletonBase, skeletonHighlight)}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div>Ошибка при загрузке данных</div>;
  }

  const items =
    data?.pages.flat().map((anime) => (
      <AnimePlate
        key={anime.animeResult.anime_url}
        animeData={anime}
        onNavigate={navigate}
      />
    )) ?? [];

  return (
    <div>
      <h1>История просмотров</h1>
      <InfiniteScroll
        items={items}
        loadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoading={isFetchingNextPage}
      />
    </div>
  )
}
