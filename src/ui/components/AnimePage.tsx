import "./AnimePage.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import { Anime, AnimeSeed, useAnimeQuery } from "../../api/source/Yumme_anime_ru";
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
  const location = useLocation();
  const state = location.state as { anime?: Anime; seed?: AnimeSeed } | null;
  const seed = state?.anime?.animeResult ?? state?.seed ?? null;
  const skeletonBase = "#2a2a2a";
  const skeletonHighlight = "#3a3a3a";

  const { data: animeData, isLoading, isError } = useAnimeQuery(url, {
    initialData: state?.anime,
  });

  useEffect(() => {
    setStatus(SaveManager.checkAnimeStatus(url));
  }, [url]);

  useEffect(() => {
    SaveManager.setAnimeStatus(url, AnimeStatus);
  }, [AnimeStatus, url])

  if (isLoading && !seed) return <LoadingSpinner />;

  if (isError && !seed) {
    return <div>Ошибка при загрузке данных</div>;
  }

  const display = animeData?.animeResult ?? seed;
  if (!display) {
    return <LoadingSpinner />;
  }

  const rating = display.rating?.average ?? 0;
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
      display.anime_url,
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
          {display.poster?.huge ? (
            <img
              className="anime-page-thumbnail"
              src={
                display.poster.huge &&
                !display.poster.huge.startsWith("http")
                  ? `https:${display.poster.huge}`
                  : display.poster.huge
              }
              alt={display.title}
            />
          ) : (
            <Skeleton
              width={300}
              height={420}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          )}
        </div>
        <div className="anime-page-title-info">
          {display.title ? (
            <h1 className="anime-page-title">{display.title}</h1>
          ) : (
            <Skeleton
              width="70%"
              height={32}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          )}

          <div className="anime-page-meta">
            {display.anime_status?.title ? (
              <div
                className="meta-el anime-status"
                data-status={display.anime_status.title}
              >
                {display.anime_status.title}
              </div>
            ) : (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            )}
            {display.type?.name ? (
              <div className="meta-el">{display.type.name}</div>
            ) : (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            )}
            {display.year ? (
              <div className="meta-el">{display.year}</div>
            ) : (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            )}
          </div>
          {display.genres && display.genres.length > 0 ? (
              <div className="anime-page-genres">
                {display.genres.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre.title}
                  </span>
                ))}
              </div>
            ) : (
              <div className="anime-page-genres">
                <Skeleton
                  width={90}
                  height={24}
                  baseColor={skeletonBase}
                  highlightColor={skeletonHighlight}
                  borderRadius={12}
                />
                <Skeleton
                  width={90}
                  height={24}
                  baseColor={skeletonBase}
                  highlightColor={skeletonHighlight}
                  borderRadius={12}
                />
                <Skeleton
                  width={90}
                  height={24}
                  baseColor={skeletonBase}
                  highlightColor={skeletonHighlight}
                  borderRadius={12}
                />
              </div>
            )}
          {rating > 0 ? (
            <div className="rating-container-page">
              <div className="rating-stars">{stars}</div>
              <div className="rating-value">{rating.toFixed(1)}</div>
            </div>
          ) : (
            <Skeleton
              width={160}
              height={32}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          )}
          {animeData?.players && animeData.players.length > 0 && (
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
              enabledByDefault={SaveManager.CheckIsFavourite(display.anime_url)} 
              onEnable={() => SaveManager.addAnimeToFavourites(display.anime_url)} 
              onDisable={() => SaveManager.removeAnimeFromFavourites(display.anime_url)}
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
        {display.description ? (
          <p className="anime-page-description">
            {display.description}
          </p>
        ) : (
          <Skeleton
            height={120}
            baseColor={skeletonBase}
            highlightColor={skeletonHighlight}
          />
        )}
        {animeData?.animeResult.viewing_order &&
          animeData.animeResult.viewing_order.length > 0 && (
            <div className="viewing-order-container">
              <h2 className="viewing-order-title">Порядок просмотра</h2>
              <div className="viewing-order-list">
                {animeData.animeResult.viewing_order.map((item, index) => (
                  <div
                    key={index}
                    className="viewing-order-item"
                    onClick={() =>
                      navigate(`/anime?url=${encodeURIComponent(item.anime_url)}`, {
                        state: {
                          seed: {
                            anime_url: item.anime_url,
                            title: item.title,
                            poster: item.poster,
                            description: item.description,
                            anime_status: item.anime_status,
                            type: item.type,
                            year: item.year,
                          },
                        },
                      })
                    }
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
