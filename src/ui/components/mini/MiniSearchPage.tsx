import SearchPage from "../AnimeSearchPage";
import "./MiniView.css";

export default function MiniSearchPage({ query }: { query: string }) {
  return (
    <div className="mini-view">
      <SearchPage query={query} />
    </div>
  );
}
