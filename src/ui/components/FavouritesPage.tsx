import { InfiniteScroll } from "./InfiniteScrol";
import { Anime, useAnimeListInfiniteQuery } from "../../api/source/Yumme_anime_ru";
import { SaveManager } from "../saveManager";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

function AnimePlate(
  animeData: Anime,
  navigate: (to: string) => void
) {
  return (
    <a
      className="anime-plate"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => navigate(`/anime?url=${encodeURIComponent(animeData.animeResult.anime_url)}`)}
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

export default function FavouritesPage() {
  const favourites = SaveManager.getFavourites();
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimeListInfiniteQuery(favourites);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Ошибка при загрузке данных</div>;
  }

  const items =
    data?.pages.flat().map((anime) => AnimePlate(anime, navigate)) ?? [];

  return (
    <div>
      <h1>Избранные</h1>
      <InfiniteScroll
        items={items}
        loadMore={fetchNextPage}
        hasMore={Boolean(hasNextPage)}
        isLoading={isFetchingNextPage}
      />
    </div>
  )
}
