import { InfiniteScroll } from "./InfiniteScrol";
import { Anime } from "../../api/source/Yumme_anime_ru";
import { YummyAnimeExtractor } from "../../api/source/Yumme_anime_ru";
import { SaveManager } from "../saveManager";
import { useNavigate } from "react-router-dom";

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
  const getAnime = async (url: string) => {
    try {
      const extractor = new YummyAnimeExtractor();
      const anime = await extractor.getAnime(url);
      return AnimePlate(anime, navigate);
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  return (
    <div>
      <h1>Избранные</h1>
      <InfiniteScroll fetchFn={getAnime} args={favourites} />
    </div>
  )
}
