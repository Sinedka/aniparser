import "./AnimeSearchPage.css";
import { Search, seedFromSearch, useSearchQuery } from "../../api/source/Yumme_anime_ru";
import LoadingSpinner from "./LoadingSpinner";
import { useNavigate } from "react-router-dom";

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

export default function SearchPage({ query }: { query: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSearchQuery(query);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Ошибка при загрузке данных</div>;
  }

  const list = data ?? [];

  return (
    <div className="anime-list">
      {list.map((obj, i) => (
        <div key={i}>{AnimePlate(obj, navigate)}</div>
      ))}
    </div>
  );
}
