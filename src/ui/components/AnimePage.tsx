import "./AnimePage.css";
import { useEffect, useState } from "react";
import { useAnimeQuery } from "../../api/source/Yumme_anime_ru";
import LoadingSpinner from "./LoadingSpinner";
import { SaveManager } from "../saveManager";
import HeartToggle from "./HeartToggle";
import CustomSelect from "./CustomSelect";
import { useNavigate } from "react-router-dom";

export default function AnimePage({ url }: { url: string }) {
  const [AnimeStatus, setStatus] = useState<number>(
    SaveManager.checkAnimeStatus(url)
  );
  const navigate = useNavigate();

  const { data: animeData, isLoading, isError } = useAnimeQuery(url);

  useEffect(() => {
    setStatus(SaveManager.checkAnimeStatus(url));
  }, [url]);

  useEffect(() => {
    SaveManager.setAnimeStatus(url, AnimeStatus);
  }, [AnimeStatus, url])

  if (isLoading) return <LoadingSpinner />;

  if (isError || !animeData) {
    return <div>Ошибка при загрузке данных</div>;
  }

  const rating = animeData.animeResult.rating.average;
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

  // Текст для кнопки в зависимости от наличия сохранения
  const getWatchButtonText = () => {
    const savedProgress = SaveManager.getAnimeProgress(
      animeData.animeResult.anime_url,
    );
    if (savedProgress) {
      return `Продолжить просмотр с ${savedProgress.episode + 1} серии`;
    } else {
      return "Начать просмотр";
    }
  };

  return (
    <div className={"anime-page"}>
      <div className="anime-page-info">
        <div className="anime-page-poster">
          <img
            className="anime-page-thumbnail"
            src={
              animeData.animeResult.poster.huge &&
                !animeData.animeResult.poster.huge.startsWith("http")
                ? `https:${animeData.animeResult.poster.huge}`
                : animeData.animeResult.poster.huge
            }
            alt={animeData.animeResult.title}
          />
        </div>
        <div className="anime-page-title-info">
          <h1 className="anime-page-title">{animeData.animeResult.title}</h1>

          <div className="anime-page-meta">
            <div
              className="meta-el anime-status"
              data-status={animeData.animeResult.anime_status.title}
            >
              {animeData.animeResult.anime_status.title}
            </div>
            <div className="meta-el">{animeData.animeResult.type.name}</div>
            <div className="meta-el">{animeData.animeResult.year}</div>
          </div>
          {animeData.animeResult.genres &&
            animeData.animeResult.genres.length > 0 && (
              <div className="anime-page-genres">
                {animeData.animeResult.genres.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre.title}
                  </span>
                ))}
              </div>
            )}
          {rating > 0 && (
            <div className="rating-container-page">
              <div className="rating-stars">{stars}</div>
              <div className="rating-value">{rating.toFixed(1)}</div>
            </div>
          )}
          {animeData.players && animeData.players.length > 0 && (
            <button
              className="watch-button"
              onClick={() => {
                if(AnimeStatus == 0 || AnimeStatus == 1 || AnimeStatus == 4) SaveManager.setAnimeStatus(url, 2);
                navigate("/player", { state: { anime: animeData } });
              }}
            >
              {getWatchButtonText()}
            </button>
          )}
          <div className="playlists">
            <HeartToggle 
              enabledByDefault={SaveManager.CheckIsFavourite(animeData.animeResult.anime_url)} 
              onEnable={() => SaveManager.addAnimeToFavourites(animeData.animeResult.anime_url)} 
              onDisable={() => SaveManager.removeAnimeFromFavourites(animeData.animeResult.anime_url)}
            />
            <select
              className="select-status"
              value={AnimeStatus}
              onChange={(e) => setStatus(Number(e.target.value))}
            >
              <option value='0'> Hесмотрел </option>
              <option value='1'> Запланированно </option>
              <option value='2'> Смотрю </option>
              <option value='3'> Просмотренно </option>
              <option value='4'> Отложенно </option>
              <option value='5'> Брошенно </option>
              <option value='6'> Не буду смотреть </option>

            </select>
            <CustomSelect options={[
              {
                value: 0,
                label: 'Hесмотрел',
              },
              {
                value: 1,
                label: 'Запланированно',
              },
              {
                value: 2,
                label: 'Смотрю',
              },
              {
                value: 3,
                label: 'Просмотренно',
              },
              {
                value: 4,
                label: 'Отложенно',
              },
              {
                value: 5,
                label: 'Брошенно',
              },
              {
                value: 6,
                label: 'Не буду смотреть',
              },
            ]} value={AnimeStatus} onChange={(e) => setStatus(Number(e))} />
          </div>
        </div>
      </div>
      <div className="anime-page-description-container">
        <p className="anime-page-description">
          {animeData.animeResult.description}
        </p>
        {animeData.animeResult.viewing_order &&
          animeData.animeResult.viewing_order.length > 0 && (
            <div className="viewing-order-container">
              <h2 className="viewing-order-title">Порядок просмотра</h2>
              <div className="viewing-order-list">
                {animeData.animeResult.viewing_order.map((item, index) => (
                  <div
                    key={index}
                    className="viewing-order-item"
                    onClick={() => navigate(`/anime?url=${encodeURIComponent(item.anime_url)}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="viewing-order-item-poster">
                      <img
                        className="viewing-order-item-thumbnail"
                        src={
                          item.poster.huge &&
                            !item.poster.huge.startsWith("http")
                            ? `https:${item.poster.huge}`
                            : item.poster.huge
                        }
                        alt={item.title}
                      />
                    </div>
                    <div className="viewing-order-item-info">
                      <h3 className="viewing-order-item-title">{item.title}</h3>
                      <div className="viewing-order-item-meta">
                        <span className="viewing-order-item-type">
                          {item.type.name}
                        </span>
                        <span className="viewing-order-item-year">
                          {item.year}
                        </span>
                        <span
                          className="viewing-order-item-status"
                          data-status={item.anime_status.title}
                        >
                          {item.anime_status.title}
                        </span>
                      </div>
                      {item.description && (
                        <p className="viewing-order-item-description">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
