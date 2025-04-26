import "./AnimeSearchPage.css";
import { useEffect, useState } from "react";
import { Search, YummyAnimeExtractor } from "../../api/source/Yumme_anime_ru";
import { openAnimePage } from "../body";
import LoadingSpinner from "./LoadingSpinner";

export async function SearchAnime(
  query: string,
  callback: (list: Search[]) => void
) {
  const searchData = await new YummyAnimeExtractor().Search(query);
  callback(searchData);
}

async function openAnime(search_data: Search) {
  openAnimePage(search_data.searchResult.anime_url);
}

function AnimePlate(search_data: Search) {
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
      onClick={() => openAnime(search_data)}
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
  const [list, setList] = useState<Search[]>([]);
  useEffect(() => {
    SearchAnime(query, (list: Search[]) => setList(list));
  }, [query]);

  if (list.length === 0) {
    return <LoadingSpinner />;
  }
  return (
    <div className="anime-list">
      {list.map((obj, i) => (
        <div key={i}>{AnimePlate(obj)}</div>
      ))}
    </div>
  );
}
