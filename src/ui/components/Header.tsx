import "./Header.css";
import { FaSearch, FaHome, FaHeart } from "react-icons/fa";
import { useState, useRef, useCallback } from "react";
import WindowControllButtons from "./WindowControlButtons";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleMouseDown = useCallback(() => {
    console.log("⏺ mouse down на drag-region");
  }, []);

  const handleMouseUp = useCallback(() => {
    console.log("✅ mouse up на drag-region");
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      console.log("➡️ двигаем мышь по drag-region:", e.clientX, e.clientY);
    }
  }, []);

  const handleSearch = () => {
    if (searchValue.length > 2) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
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
            className="search-input"
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
        <button className="header-button" onClick={() => navigate("/favourites")}>
          <FaHeart />
        </button>
        <button className="header-button"
          onClick={() => {
            navigate("/");
          }}
        >
          <FaHome />
        </button>
      </div>
      <WindowControllButtons />
    </div>
  );
}
