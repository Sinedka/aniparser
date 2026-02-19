import "./AnimeSearchPage.css";
import { Search, seedFromSearch, useSearchQuery } from "../../api/source/Yumme_anime_ru";
import { type NavigateFunction, useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import PosterFrame from "./PosterFrame";
import { useStatusStore } from "../saveManager";

function AnimePlate({
  searchData,
  onNavigate,
}: {
  searchData: Search;
  onNavigate: NavigateFunction;
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
  const rating = searchData.searchResult.rating.average;
  const statusValue = useStatusStore(
    (state) => state.animeStatus[searchData.searchResult.anime_url] ?? 0,
  );
  const statusKey = statusKeyFromValue(statusValue);
  const stars = Array(5)
    .fill(0)
    .map((_, index) => {
      const starValue = (index + 1) * 2;
      return (
        <span
          key={index}
          className={`star ${rating >= starValue ? "filled" : ""}`}
        >
          ★
        </span>
      );
    });

  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        onNavigate(`/anime?url=${encodeURIComponent(searchData.searchResult.anime_url)}`, {
          state: { seed: seedFromSearch(searchData) },
        })
      }
    >
      <PosterFrame
        className="thumbnail"
        status={statusKey}
        src={
          !searchData.searchResult.poster.huge.startsWith("http")
            ? `https:${searchData.searchResult.poster.huge}`
            : searchData.searchResult.poster.huge
        }
        alt={searchData.searchResult.title}
        imgClassName="thumbnail-img"
      >
        {rating > 0 && (
          <div className="rating-container">
            <div className="rating-stars">{stars}</div>
            <div className="rating-value">{rating.toFixed(1)}</div>
          </div>
        )}
      </PosterFrame>
      <div className="anime-data">
        <h3 className="title">{searchData.searchResult.title}</h3>
        <div className="small-info">
          <div
            className="small-info-el anime-status"
            data-status={searchData.searchResult.anime_status.title}
          >
            {searchData.searchResult.anime_status.title}
          </div>
          <div className="small-info-el">
            {searchData.searchResult.type.name}
          </div>
          <div className="small-info-el">{searchData.searchResult.year}</div>
        </div>

        <p className="description">{searchData.searchResult.description}</p>
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

export default function SearchPage({ query }: { query: string }) {
  const navigate = useNavigate();
  const { data, isFetching, isError, isPending } = useSearchQuery(query);
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";

  if (isPending || (isFetching && !data)) {
    return (
      <div className="anime-list">
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

  const list = data ?? [];

  return (
    <div className="anime-list">
      {list.length === 0 ? (
        <h2 className="search-empty">Ничего не найдено</h2>
      ) : (
        <h2 className="search-title">Поиск по запросу "{query}"</h2>
      )}
      {list.map((obj, i) => (
        <div key={i}>
          <AnimePlate searchData={obj} onNavigate={navigate} />
        </div>
      ))}
    </div>
  );
}
