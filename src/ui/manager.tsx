import SearchPage from "./components/AnimeSearchPage";
import AnimePage from "./components/AnimePage";
import { Player } from "./components/player";
import { Anime } from "../api/source/Yumme_anime_ru";
export enum BodyType {
  Search,
  Anime,
  Player,
}

export class BodyElement {
  type: BodyType;
  value: string | Anime;

  constructor(type: BodyType, value: string | Anime) {
    this.type = type;
    this.value = value;
  }

  render() {
    if (this.type === BodyType.Player && this.value instanceof Anime) {
      return <Player anime={this.value} />;
    }
    if (this.type === BodyType.Search && typeof this.value === "string") {
      return <SearchPage query={this.value} />;
    }
    if (this.type === BodyType.Anime && typeof this.value === "string") {
      return <AnimePage url={this.value} />;
    }
  }
}
