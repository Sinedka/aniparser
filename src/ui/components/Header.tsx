import "./Header.css";
import { FaSearch, FaHome, FaHeart, FaArrowLeft, FaArrowRight, FaColumns } from "react-icons/fa";
import { useState, useRef, useCallback, useEffect } from "react";
import WindowControllButtons from "./WindowControlButtons";
import { useNavigate } from "react-router-dom";
import appIcon from "../assets/icon.svg";
import { keyStack } from "../keyboard/KeyStack";

type HeaderProps = {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onToggleLeft: () => void;
  isLeftHidden: boolean;
  canToggleLeft: boolean;
};

export default function Header({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onToggleLeft,
  isLeftHidden,
  canToggleLeft,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  useEffect(() => {
    if (!isSearchFocused) return () => {};
    const handler = (event: KeyboardEvent) => {
      if (document.activeElement !== inputRef.current) return;
      event.preventDefault();
      handleSearch();
    };
    const unsubscribe = keyStack.subscribe("Enter", handler);
    return () => unsubscribe();
  }, [isSearchFocused, handleSearch]);

  return (
    <div className="header">
      <div className="header-left">
        <div className="header-brand">
          <img className="header-app-icon" src={appIcon} alt="Anime Parser" />
          <h1>AniParser</h1>
          <div className="header-nav-controls">
            <button
              className="header-button header-button-compact"
              onClick={onBack}
              disabled={!canGoBack}
              aria-label="Назад"
            >
              <FaArrowLeft />
            </button>
            <button
              className="header-button header-button-compact"
              onClick={onForward}
              disabled={!canGoForward}
              aria-label="Вперёд"
            >
              <FaArrowRight />
            </button>
            <button
              className="header-button header-button-compact"
              onClick={onToggleLeft}
              disabled={!canToggleLeft}
              aria-pressed={isLeftHidden}
              aria-label="Скрыть левую панель"
            >
              <FaColumns />
            </button>
          </div>
        </div>
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
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
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
