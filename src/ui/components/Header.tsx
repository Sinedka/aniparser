import "./Header.css";
import { closeAll, searchAnime, openFavourites } from "../body";
import { FaSearch, FaHome, FaHeart } from "react-icons/fa";
import { useState, useRef } from "react";
import WindowControllButtons from "./WindowControlButtons";

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (searchValue.length > 2) {
      searchAnime(searchValue);
      setSearchValue("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        <h1>Anime Parser</h1>
      </div>

      <div className="header-center">
        <div className="search-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Поиск аниме..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="header-button" onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="header-right">
        <button className="header-button" onClick={() => openFavourites()}>
          <FaHeart />
        </button>
        <button className="header-button"
          onClick={() => {
            closeAll();
          }}
        >
          <FaHome />
        </button>
      </div>
      <WindowControllButtons />
    </div>
  );
}
