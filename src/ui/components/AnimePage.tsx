import "./AnimePage.css";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useAnime } from "../../api/source/Yumme_anime_ru";
import {
  useFavouritesStore,
  useProgressStore,
  useStatusStore,
} from "../saveManager";
import HeartToggle from "./HeartToggle";
import PosterFrame from "./PosterFrame";
import { useNavigate } from "react-router-dom";

export default function AnimePage({
  id,
}: {
  id: string;
}) {
  const animeStatus = useStatusStore((state) => state.animeStatus[id] ?? 0);
  const animeStatusMap = useStatusStore((state) => state.animeStatus);
  const setAnimeStatus = useStatusStore((state) => state.setAnimeStatus);
  const animeProgress = useProgressStore((state) => state.animeProgress);
  const favourites = useFavouritesStore((state) => state.favourites);
  const addAnimeToFavourites = useFavouritesStore(
    (state) => state.addAnimeToFavourites,
  );
  const removeAnimeFromFavourites = useFavouritesStore(
    (state) => state.removeAnimeFromFavourites,
  );
  const navigate = useNavigate();
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";

  const [error, animeData] = useAnime(id);
  useEffect(() => {
    console.log(animeData);
  }, [animeData])

  const statusOptions = [
    { value: 0, label: "Не смотрел", key: "none" },
    { value: 1, label: "Запланированно", key: "planned" },
    { value: 2, label: "Смотрю", key: "watching" },
    { value: 3, label: "Просмотренно", key: "completed" },
    { value: 5, label: "Брошенно", key: "dropped" },
  ];

  const [isStatusOpen, setStatusOpen] = useState(false);
  const statusSelectRef = useRef<HTMLDivElement | null>(null);
  const currentStatus =
    statusOptions.find((option) => option.value === animeStatus) ??
    statusOptions[0];

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

  const posterStatusKey = statusKeyFromValue(animeStatus);

  useEffect(() => {
    if (!statusOptions.some((option) => option.value === animeStatus)) {
      setAnimeStatus(id, statusOptions[0].value);
    }
  }, [animeStatus, setAnimeStatus, statusOptions, id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusSelectRef.current &&
        !statusSelectRef.current.contains(event.target as Node)
      ) {
        setStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (error.code > 1) {
    return <div>Ошибка при загрузке данных error {error.code} {error.message}</div>;
  }

  const rating = animeData?.rating?.average | 0;
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
    const savedProgress = animeProgress[animeData.anime_url];
    if (savedProgress) {
      return `Продолжить просмотр с ${savedProgress.episode + 1} серии`;
    } else {
      return "Начать просмотр";
    }
  };

  return (
    <div className={"anime-page"}>
      <div className="anime-page-info">
        {animeData?.poster?.huge ? (
          <PosterFrame
            className="anime-page-poster"
            status={posterStatusKey}
            src={
              animeData.poster.huge &&
              !animeData.poster.huge.startsWith("http")
                ? `https:${animeData.poster.huge}`
                : animeData.poster.huge
            }
            alt={animeData.title}
            imgClassName="anime-page-thumbnail"
          />
        ) : error.code === 1 ? (
            <Skeleton
              width={300}
              height={420}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          ) : (
            <div className="anime-page-thumbnail" />
          )}
        <div className="anime-page-title-info">
          {animeData?.title ? (
            <h1 className="anime-page-title">{animeData.title}</h1>
          ) : error.code === 1 ? (
            <Skeleton
              width="70%"
              height={32}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          ) : (
            <h1 className="anime-page-title">Без названия</h1>
          )}

          <div className="anime-page-meta">
            {animeData?.anime_status?.title ? (
              <div
                className="meta-el anime-status"
                data-status={animeData.anime_status.title}
              >
                {animeData?.anime_status.title}
              </div>
            ) : error.code === 1 ? (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            ) : null}
            {animeData?.type?.name ? (
              <div className="meta-el">{animeData.type.name}</div>
            ) : error.code === 1 ? (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            ) : null}
            {animeData?.year ? (
              <div className="meta-el">{animeData.year}</div>
            ) : error.code === 1 ? (
              <Skeleton
                width={110}
                height={28}
                baseColor={skeletonBase}
                highlightColor={skeletonHighlight}
              />
            ) : null}
          </div>
          {animeData?.genres && animeData.genres.length > 0 ? (
              <div className="anime-page-genres">
                {animeData.genres.map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre.title}
                  </span>
                ))}
              </div>
            ) : error.code === 1 ? (
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
            ) : (
              <div className="anime-page-genres">Нет жанров</div>
            )}
          {rating > 0 ? (
            <div className="rating-container-page">
              <div className="rating-stars">{stars}</div>
              <div className="rating-value">{rating.toFixed(1)}</div>
            </div>
          ) : error.code === 1 ? (
            <Skeleton
              width={160}
              height={32}
              baseColor={skeletonBase}
              highlightColor={skeletonHighlight}
            />
          ) : null}
          {animeData?.videos && animeData.videos.length > 0 && (
            <button
              className="watch-button"
              onClick={() => {
                if (animeStatus == 0 || animeStatus == 1 || animeStatus == 4) {
                  setAnimeStatus(id, 2);
                }
                navigate("/player", { state: { anime: animeData } });
              }}
            >
              {getWatchButtonText()}
            </button>
          )}
          <div className="playlists">
            <HeartToggle 
              enabledByDefault={favourites.includes(animeData?.anime_url)}
              onEnable={() => addAnimeToFavourites(animeData?.anime_url)}
              onDisable={() => removeAnimeFromFavourites(animeData?.anime_url)}
            />
            <div
              className="custom-select"
              data-status={currentStatus.key}
              ref={statusSelectRef}
            >
              <button
                className="custom-select-trigger"
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isStatusOpen}
                onClick={() => setStatusOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setStatusOpen(false);
                  }
                }}
              >
                <span className="custom-select-label">{currentStatus.label}</span>
                <span
                  className={`custom-select-arrow ${isStatusOpen ? "open" : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>
              {isStatusOpen && (
                <div className="custom-select-menu" role="listbox">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={option.value === animeStatus}
                      data-status={option.key}
                      className={`custom-select-option ${
                        option.value === animeStatus ? "selected" : ""
                      }`}
                      onClick={() => {
                        setAnimeStatus(id, option.value);
                        setStatusOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="anime-page-description-container">
        {animeData?.description ? (
          <p className="anime-page-description">
            {animeData.description}
          </p>
        ) : error.code === 1 ? (
          <Skeleton
            height={120}
            baseColor={skeletonBase}
            highlightColor={skeletonHighlight}
          />
        ) : (
          <p className="anime-page-description">Описание отсутствует</p>
        )}
        {animeData?.viewing_order &&
          animeData.viewing_order.length > 0 && (
            <div className="viewing-order-container">
              <h2 className="viewing-order-title">Порядок просмотра</h2>
              <div className="viewing-order-list">
                {animeData.viewing_order.map((item, index) => (
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
                    <PosterFrame
                      className="viewing-order-item-poster"
                      status={statusKeyFromValue(
                        animeStatusMap[item.anime_url] ?? 0,
                      )}
                      src={
                        item.poster.huge &&
                          !item.poster.huge.startsWith("http")
                          ? `https:${item.poster.huge}`
                          : item.poster.huge
                      }
                      alt={item.title}
                      imgClassName="viewing-order-item-thumbnail"
                    >
                      <div className="viewing-order-item-overlay">
                        <div className="viewing-order-item-overlay-top">
                          <span className="viewing-order-item-overlay-chip">
                            {item.year}
                          </span>
                          <span className="viewing-order-item-overlay-chip">
                            {item.type.name}
                          </span>
                          <span
                            className="viewing-order-item-overlay-chip viewing-order-item-status"
                            data-status={item.anime_status.title}
                          >
                            {item.anime_status.title}
                          </span>
                        </div>
                        <div className="viewing-order-item-overlay-bottom">
                          <span className="viewing-order-item-overlay-title">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    </PosterFrame>
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
