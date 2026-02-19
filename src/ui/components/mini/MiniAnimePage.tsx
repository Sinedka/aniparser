import { Anime, AnimeSeed } from "../../../api/source/Yumme_anime_ru";
import AnimePage from "../AnimePage";
import "./MiniView.css";

export default function MiniAnimePage({
  url,
  anime,
  seed,
}: {
  url: string;
  anime?: Anime | null;
  seed?: AnimeSeed | null;
}) {
  return (
    <div className="mini-view">
      <AnimePage url={url} animeOverride={anime ?? null} seedOverride={seed ?? null} />
    </div>
  );
}
