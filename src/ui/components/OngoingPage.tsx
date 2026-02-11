import "./OngoingPage.css";
import { Ongoing, Anime, seedFromOngoing, useAnimeQuery, useOngoingsQuery } from "../../api/source/Yumme_anime_ru";
import { SaveManager } from "../saveManager";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

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

function AnimePlate(animeData: Anime, navigate: (to: string) => void) {
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

export default function OngoingPage() {
  const history = SaveManager.getHistory();
  const latestUrl = history[0] || null;
  const navigate = useNavigate();
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";

  const {
    data: ongoings,
    isLoading: isOngoingsLoading,
    isError: isOngoingsError,
  } = useOngoingsQuery();

  const { data: latestAnime } = useAnimeQuery(
    latestUrl,
    { enabled: Boolean(latestUrl) }
  );

  if (isOngoingsLoading) {
    return (
      <>
        {latestUrl && (
          <div className="history-Background">
            <h2 className="continue-watching"> Продолжение просмотра </h2>
            {SkeletonPlate(skeletonBase, skeletonHighlight)}
            <button
              className="full-history-button"
              onClick={() => navigate("/history")}
            >
              вся история
            </button>
          </div>
        )}
        <div className="flip-cards-container">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flip-card-wrapper">
              <div className="flip-card">
                <div className="flip-card-front">
                  <Skeleton
                    height="100%"
                    width="100%"
                    baseColor={skeletonBase}
                    highlightColor={skeletonHighlight}
                  />
                </div>
                <div className="flip-card-back">
                  <div className="flip-card-back-content">
                    <Skeleton
                      width="80%"
                      height={22}
                      baseColor={skeletonBase}
                      highlightColor={skeletonHighlight}
                    />
                    <Skeleton
                      count={3}
                      height={12}
                      baseColor={skeletonBase}
                      highlightColor={skeletonHighlight}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (isOngoingsError) {
    return (
      <div className="error-container">
        <p className="error-text">Ошибка при загрузке данных</p>
      </div>
    );
  }

  return (
    <>
      {latestUrl && !latestAnime && (
        <div className="history-Background">
          <h2 className="continue-watching"> Продолжение просмотра </h2>
          <div className="anime-plate">
            <Skeleton
              height={180}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          </div>
        </div>
      )}
      {latestAnime && (
        <div className="history-Background">
          <h2 className="continue-watching"> Продолжение просмотра </h2>
          {AnimePlate(latestAnime, navigate)}
          <button className="full-history-button" onClick={() => navigate("/history")}> вся история</button>
        </div>
      )}
      <div className="flip-cards-container">
        {(ongoings ?? []).map((obj, i) => (
          <div
            key={i}
            className="flip-card-wrapper"
            onClick={() =>
              navigate(`/anime?url=${encodeURIComponent(obj.ongoingResult.anime_url)}`, {
                state: { seed: seedFromOngoing(obj) },
              })
            }
          >
            {OngoingPlate(obj)}
          </div>
        ))}
      </div>
    </>
  );
}
