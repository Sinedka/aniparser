import SearchPage from "./components/AnimeSearchPage";
import AnimePage from "./components/AnimePage";
import Player from "./components/player/player";
import HistoryPage from "./components/HistoryPage";
import { Anime } from "../api/source/Yumme_anime_ru";
import FavouritesPage from "./components/FavouritesPage";


export enum BodyType {
  Search,
  Anime,
  Player,
  History,
  Favourites
}

export class BodyElement {
  type: BodyType;
  value: string | Anime | undefined = undefined;

  constructor(type: BodyType, value: string | Anime);
  constructor(type: BodyType);

  constructor(type: BodyType, value?: string | Anime) {
    this.type = type;
    if(value) {
      this.value = value;
    }
  }

  get Body() {
    if (this.type === BodyType.Player && this.value instanceof Anime)
      return <Player anime={this.value} />;
    if (this.type === BodyType.Search && typeof this.value === "string")
      return <SearchPage query={this.value} />;
    if (this.type === BodyType.Anime && typeof this.value === "string")
      return <AnimePage url={this.value} />;
    if (this.type === BodyType.History)
      return <HistoryPage />;
    if (this.type === BodyType.Favourites)
      return <FavouritesPage />;

    console.warn("Неизвестный тип компонента:", this.type);
    return <div>Контент не найден</div>;
  }
}
