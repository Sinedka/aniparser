import "./AnimeSearchPage.css";
import { Search, seedFromSearch, useSearchQuery } from "../../api/source/Yumme_anime_ru";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

function AnimePlate(
  search_data: Search,
  navigate: (to: string) => void
) {
  const rating = search_data.searchResult.rating.average;
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
        navigate(`/anime?url=${encodeURIComponent(search_data.searchResult.anime_url)}`, {
          state: { seed: seedFromSearch(search_data) },
        })
      }
    >
      <div className="thumbnail">
        <img
          className="thumbnail-img"
          src={
            !search_data.searchResult.poster.huge.startsWith("http")
              ? `https:${search_data.searchResult.poster.huge}`
              : search_data.searchResult.poster.huge
          }
          alt={search_data.searchResult.title}
        />
        {rating > 0 && (
          <div className="rating-container">
            <div className="rating-stars">{stars}</div>
            <div className="rating-value">{rating.toFixed(1)}</div>
          </div>
        )}
      </div>
      <div className="anime-data">
        <h3 className="title">{search_data.searchResult.title}</h3>
        <div className="small-info">
          <div
            className="small-info-el anime-status"
            data-status={search_data.searchResult.anime_status.title}
          >
            {search_data.searchResult.anime_status.title}
          </div>
          <div className="small-info-el">
            {search_data.searchResult.type.name}
          </div>
          <div className="small-info-el">{search_data.searchResult.year}</div>
        </div>

        <p className="description">{search_data.searchResult.description}</p>
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

export default function SearchPage({ query }: { query: string }) {
  const navigate = useNavigate();
  const { data, isFetching, isError, isPending } = useSearchQuery(query);
  const skeletonBase = "#2a2a2a";
  const skeletonHighlight = "#3a3a3a";

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
        <div key={i}>{AnimePlate(obj, navigate)}</div>
      ))}
    </div>
  );
}
