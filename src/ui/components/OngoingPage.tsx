import "./OngoingPage.css";
import { useEffect, useState } from "react";
import { YummyAnimeExtractor, Ongoing } from "../../api/source/Yumme_anime_ru";
import { openAnimePage } from "../body";
import LoadingSpinner from "./LoadingSpinner";

async function openAnime(ongoing: Ongoing) {
  openAnimePage(ongoing.ongoingResult.anime_url);
}

function OngoingPlate(ongoing: Ongoing) {
  const posterUrl = !ongoing.ongoingResult.poster.huge.startsWith("http")
    ? `https:${ongoing.ongoingResult.poster.huge}`
    : ongoing.ongoingResult.poster.huge;

  return (
    <div className="flip-card">
      <div className="flip-card-front">
        <img src={posterUrl} alt={ongoing.ongoingResult.title} />
      </div>
      <div className="flip-card-back">
        <div className="flip-card-back-content">
          <h3 className="title">{ongoing.ongoingResult.title}</h3>
          <p className="description">{ongoing.ongoingResult.description}</p>
        </div>
        <div className="small-info">
          <div className="episodes-badge">
            {ongoing.ongoingResult.episodes.aired} /{" "}
            {ongoing.ongoingResult.episodes.count || "?"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OngoingPage() {
  const [ongoings, setOngoings] = useState<Ongoing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOngoings = async () => {
      try {
        const extractor = new YummyAnimeExtractor();
        const result = await extractor.getOngoings();
        setOngoings(result);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOngoings();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="flip-cards-container">
      {ongoings.map((obj, i) => (
        <div
          key={i}
          className="flip-card-wrapper"
          onClick={() => openAnime(obj)}
        >
          {OngoingPlate(obj)}
        </div>
      ))}
    </div>
  );
}
