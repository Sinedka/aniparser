import { InfiniteScroll } from "./InfiniteScrol";
import { Anime, useAnimeListInfiniteQuery } from "../../api/source/Yumme_anime_ru";
import { SaveManager } from "../saveManager";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

function AnimePlate(
  animeData: Anime,
  navigate: (to: string) => void
) {
  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        navigate(`/anime?url=${encodeURIComponent(animeData.animeResult.anime_url)}`, {
          state: { anime: animeData },
        })
      }
    >
      <div className="thumbnail">
        <img
          className="thumbnail-img"
          src={
            !animeData.animeResult.poster.huge.startsWith("http")
              ? `https:${animeData.animeResult.poster.huge}`
              : animeData.animeResult.poster.huge
          }
          alt={animeData.animeResult.title}
        />
      </div>
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
        <div style={{ width: "100%", aspectRatio: "5 / 7" }}>
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

export default function FavouritesPage() {
  const favourites = SaveManager.getFavourites();
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
  } = useAnimeListInfiniteQuery(favourites);

  if (isLoading) {
    return (
      <div>
        <h1>Избранные</h1>
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
    data?.pages.flat().map((anime) => AnimePlate(anime, navigate)) ?? [];

  return (
    <div>
      <h1>Избранные</h1>
      <InfiniteScroll
        items={items}
        loadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoading={isFetchingNextPage}
      />
    </div>
  )
}
