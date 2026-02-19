import "./FavouritesPage.css";
import { InfiniteScroll } from "./InfiniteScrol";
import { Anime, useAnimeListInfiniteQuery } from "../../api/source/Yumme_anime_ru";
import { useFavouritesStore, useStatusStore } from "../saveManager";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import PosterFrame from "./PosterFrame";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaHeart, FaCalendarAlt, FaPlay, FaCheck, FaTimes } from "react-icons/fa";
import HeartToggle from "./HeartToggle";

const statusOptions = [
  { value: 0, label: "Не смотрел", key: "none" },
  { value: 1, label: "Запланированно", key: "planned" },
  { value: 2, label: "Смотрю", key: "watching" },
  { value: 3, label: "Просмотренно", key: "completed" },
  { value: 5, label: "Брошенно", key: "dropped" },
] as const;

function AnimePlate({
  animeData,
  onNavigate,
}: {
  animeData: Anime;
  onNavigate: (to: string, options?: { state?: unknown }) => void;
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
  const statusValue = useStatusStore(
    (state) => state.animeStatus[animeData.animeResult.anime_url] ?? 0,
  );
  const setAnimeStatus = useStatusStore((state) => state.setAnimeStatus);
  const favourites = useFavouritesStore((state) => state.favourites);
  const addAnimeToFavourites = useFavouritesStore(
    (state) => state.addAnimeToFavourites,
  );
  const removeAnimeFromFavourites = useFavouritesStore(
    (state) => state.removeAnimeFromFavourites,
  );
  const statusKey = statusKeyFromValue(statusValue);
  const isFavourite = favourites.includes(animeData.animeResult.anime_url);
  const [isStatusOpen, setStatusOpen] = useState(false);
  const statusSelectRef = useRef<HTMLDivElement | null>(null);
  const currentStatus =
    statusOptions.find((option) => option.value === statusValue) ??
    statusOptions[0];

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
  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        onNavigate(`/anime?url=${encodeURIComponent(animeData.animeResult.anime_url)}`, {
          state: { anime: animeData },
        })
      }
    >
      <PosterFrame
        className="thumbnail"
        status={statusKey}
        src={
          !animeData.animeResult.poster.huge.startsWith("http")
            ? `https:${animeData.animeResult.poster.huge}`
            : animeData.animeResult.poster.huge
        }
        alt={animeData.animeResult.title}
        imgClassName="thumbnail-img"
      >
      </PosterFrame>
      <div className="anime-data">
        <div className="anime-plate-header">
          <h3 className="title">{animeData.animeResult.title}</h3>
          <div
            className="playlists"
            onClick={(event) => event.stopPropagation()}
          >
            <HeartToggle
              enabledByDefault={isFavourite}
              onEnable={() =>
                addAnimeToFavourites(animeData.animeResult.anime_url)
              }
              onDisable={() =>
                removeAnimeFromFavourites(animeData.animeResult.anime_url)
              }
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
                <span className="custom-select-label">
                  {currentStatus.label}
                </span>
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
                      aria-selected={option.value === statusValue}
                      data-status={option.key}
                      className={`custom-select-option ${
                        option.value === statusValue ? "selected" : ""
                      }`}
                      onClick={() => {
                        setAnimeStatus(animeData.animeResult.anime_url, option.value);
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

export default function FavouritesPage() {
  const favourites = useFavouritesStore((state) => state.favourites);
  const animeStatus = useStatusStore((state) => state.animeStatus);
  const navigate = useNavigate();
  const skeletonBase = "var(--skeleton-base)";
  const skeletonHighlight = "var(--skeleton-highlight)";
  const [favouritesSnapshot, setFavouritesSnapshot] = useState(favourites);

  const tabs = [
    { id: "favourites", label: "Избранные", icon: FaHeart },
    { id: "planned", label: "Запланированно", status: 1, icon: FaCalendarAlt },
    { id: "watching", label: "Смотрю", status: 2, icon: FaPlay },
    { id: "completed", label: "Просмотренно", status: 3, icon: FaCheck },
    { id: "dropped", label: "Брошенно", status: 5, icon: FaTimes },
  ] as const;

  type TabId = (typeof tabs)[number]["id"];
  const [activeTab, setActiveTab] = useState<TabId>("favourites");
  const statusTabs = tabs.filter(
    (tab): tab is (typeof tabs)[number] & { status: number } => "status" in tab,
  );

  useEffect(() => {
    if (favourites.length > favouritesSnapshot.length) {
      setFavouritesSnapshot(favourites);
    }
  }, [favourites, favouritesSnapshot.length]);

  const activeUrls = useMemo(() => {
    if (activeTab === "favourites") return favouritesSnapshot;
    const statusTab = statusTabs.find((tab) => tab.id === activeTab);
    if (!statusTab) return [];
    return Object.entries(animeStatus)
      .filter(([, status]) => status === statusTab.status)
      .map(([url]) => url);
  }, [activeTab, animeStatus, favouritesSnapshot, statusTabs]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeListInfiniteQuery(activeUrls);

  const items =
    data?.pages.flat().map((anime) => (
      <AnimePlate
        key={anime.animeResult.anime_url}
        animeData={anime}
        onNavigate={navigate}
      />
    )) ?? [];

  return (
    <div className="favourites-page">
      <div className="favourites-topbar">
        <div className="favourites-tabs" role="tablist" aria-label="Списки">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`favourites-tab${isActive ? " is-active" : ""}`}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="favourites-tab-icon">
                  <Icon />
                </span>
                <span className="favourites-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {isError ? (
        <div className="favourites-empty">Ошибка при загрузке данных</div>
      ) : activeUrls.length === 0 ? (
        <div className="favourites-empty">Список пуст</div>
      ) : isLoading ? (
        <div className="favourites-skeletons">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              {SkeletonPlate(skeletonBase, skeletonHighlight)}
            </div>
          ))}
        </div>
      ) : (
        <InfiniteScroll
          items={items}
          loadMore={fetchNextPage}
          hasMore={Boolean(hasNextPage)}
          isLoading={isFetchingNextPage}
        />
      )}
    </div>
  );
}
