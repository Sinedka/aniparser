import "./header.css";
import { closeAll, searchAnime } from "../body";
import { FaSearch, FaHome } from "react-icons/fa";
import { useState, useRef } from "react";

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
          <button onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="header-right">
        <button
          onClick={() => {
            closeAll();
          }}
        >
          <FaHome />
        </button>
      </div>
    </div>
  );
}
