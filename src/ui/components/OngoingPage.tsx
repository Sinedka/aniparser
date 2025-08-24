import "./OngoingPage.css";
import { useEffect, useState } from "react";
import { YummyAnimeExtractor, Ongoing, Anime } from "../../api/source/Yumme_anime_ru";
import { openAnimePage, openHistory } from "../body";
import LoadingSpinner from "./LoadingSpinner";
import { SaveManager } from "../saveManager";
import HeartToggle from "./HeartToggle";

async function openOngoing(ongoing: Ongoing) {
  openAnimePage(ongoing.ongoingResult.anime_url);
}

async function openAnime(anime: Anime) {
  openAnimePage(anime.animeResult.anime_url);
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

function AnimePlate(animeData: Anime) {
  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => openAnime(animeData)}
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

export default function OngoingPage() {
  const [ongoings, setOngoings] = useState<Ongoing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latestAnime, setLatestAnime] = useState<Anime | null>(null);

  useEffect(() => {
    const fetchOngoings = async () => {
      try {
        const extractor = new YummyAnimeExtractor();
        const result = await extractor.getOngoings();
        setOngoings(result);

        const history = SaveManager.getHistory();
        if(history.length != 0) {
          const anime = await extractor.getAnime(history[0]);
          setLatestAnime(anime)
        }


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
    <>
      <HeartToggle/>
      {latestAnime &&
      <div className="history-Background">
        <h2 className="continue-watching"> Продолжение просмотра </h2>
          {AnimePlate(latestAnime)}
        <button className="full-history-button" onClick={() => openHistory()}> вся история</button>
      </div>
      }
      <div className="flip-cards-container">
        {ongoings.map((obj, i) => (
          <div
            key={i}
            className="flip-card-wrapper"
            onClick={() => openOngoing(obj)}
          >
            {OngoingPlate(obj)}
          </div>
        ))}
      </div>
    </>
  );
}
