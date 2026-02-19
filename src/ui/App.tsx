import "./App.css";
import {
  RouterProvider,
  createMemoryRouter,
  Outlet,
  useLocation,
  useNavigate,
  useNavigationType,
  useSearchParams,
} from "react-router-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Header from "./components/Header";
import OngoingPage from "./components/OngoingPage";
import SearchPage from "./components/AnimeSearchPage";
import AnimePage from "./components/AnimePage";
import HistoryPage from "./components/HistoryPage";
import FavouritesPage from "./components/FavouritesPage";
import Player from "./components/player/player";
import MiniAnimePage from "./components/mini/MiniAnimePage";
import MiniSearchPage from "./components/mini/MiniSearchPage";
import MiniHistoryPage from "./components/mini/MiniHistoryPage";
import MiniFavouritesPage from "./components/mini/MiniFavouritesPage";
import { Anime, AnimeSeed } from "../api/source/Yumme_anime_ru";
import { keyStack } from "./keyboard/KeyStack";
import type { Location } from "react-router-dom";

const isRootPath = (location: Location) => location.pathname === "/";
const isAnimePath = (location: Location) => location.pathname === "/anime";
const isPlayerPath = (location: Location) => location.pathname === "/player";

type HistoryState = {
  entries: Location[];
  index: number;
};

function deriveHistoryState(
  prev: HistoryState,
  location: Location,
  navigationType: "PUSH" | "POP" | "REPLACE",
): HistoryState {
  if (navigationType === "REPLACE") {
    if (prev.index >= 0) {
      const nextEntries = [...prev.entries];
      nextEntries[prev.index] = location;
      return { entries: nextEntries, index: prev.index };
    }
    return { entries: [location], index: 0 };
  }

  if (navigationType === "POP") {
    const existingIndex = prev.entries.findIndex((entry) => entry.key === location.key);
    if (existingIndex >= 0) {
      return { entries: prev.entries, index: existingIndex };
    }
    const trimmed = prev.entries.slice(0, prev.index + 1);
    return { entries: [...trimmed, location], index: trimmed.length };
  }

  const trimmed = prev.entries.slice(0, prev.index + 1);
  return { entries: [...trimmed, location], index: trimmed.length };
}

function getMiniPageFromLocation(location: Location | null) {
  if (!location) return null;

  switch (location.pathname) {
    case "/anime": {
      const params = new URLSearchParams(location.search);
      const url = params.get("url") || "";
      const state = location.state as { anime?: Anime; seed?: AnimeSeed } | null;
      if (!url) return null;
      return <MiniAnimePage url={url} anime={state?.anime ?? null} seed={state?.seed} />;
    }
    case "/search": {
      const params = new URLSearchParams(location.search);
      const query = params.get("q") || "";
      return query ? <MiniSearchPage query={query} /> : null;
    }
    case "/history":
      return <MiniHistoryPage />;
    case "/favourites":
      return <MiniFavouritesPage />;
    default:
      return null;
  }
}

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const historyRef = useRef<HistoryState>({ entries: [], index: -1 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const [isLeftHidden, setIsLeftHidden] = useState(false);
  const isAnimeRoute = isAnimePath(location) || isPlayerPath(location);
  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
      }
    };
    const unsubscribe = keyStack.subscribe("Escape", handleKeyDown);
    return () => unsubscribe();
  }, [navigate]);

  const historyState = useMemo(
    () => deriveHistoryState(historyRef.current, location, navigationType),
    [location, navigationType],
  );

  useLayoutEffect(() => {
    historyRef.current = historyState;
    console.log("[nav-structure]", {
      index: historyState.index,
      entries: historyState.entries.map((entry) => ({
        pathname: entry.pathname,
        search: entry.search,
        key: entry.key,
      })),
    });
  }, [historyState]);

  const getForwardLocation = useCallback(() => {
    const history = historyState;
    const nextIndex = history.index + 1;
    if (nextIndex >= 0 && nextIndex < history.entries.length) {
      return history.entries[nextIndex];
    }
    return null;
  }, [historyState]);

  const findPrevLocation = useCallback((predicate: (entry: Location) => boolean) => {
    const history = historyState;
    for (let i = history.index - 1; i >= 0; i -= 1) {
      const entry = history.entries[i];
      if (predicate(entry)) return entry;
    }
    return null;
  }, [historyState]);

  const miniSource = useMemo(() => {
    if (isAnimePath(location)) {
      return findPrevLocation(
        (entry) => !isRootPath(entry) && !isPlayerPath(entry) && !isAnimePath(entry),
      );
    }
    if (isPlayerPath(location)) {
      return findPrevLocation((entry) => !isRootPath(entry) && !isPlayerPath(entry));
    }
    return null;
  }, [location, findPrevLocation, historyState]);

  const miniPage = useMemo(() => getMiniPageFromLocation(miniSource), [miniSource]);
  const canGoBack = useMemo(
    () => historyState.index > 0,
    [historyState],
  );
  const canGoForward = useMemo(
    () => historyState.index < historyState.entries.length - 1,
    [historyState],
  );

  useEffect(() => {
    if (!miniPage) return;
    if (leftWidth !== null) return;
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    setLeftWidth(Math.round(containerWidth * 0.2));
  }, [miniPage, leftWidth]);

  const shouldRenderLeft = Boolean(miniPage) && !isLeftHidden;

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      event.preventDefault();
      isResizingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const container = containerRef.current;
      const minWidth = 280;
      const maxWidth = 530;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizingRef.current) return;
        const rect = container.getBoundingClientRect();
        const nextWidth = Math.min(
          maxWidth,
          Math.max(minWidth, Math.round(moveEvent.clientX - rect.left)),
        );
        setLeftWidth(nextWidth);
      };

      const handleMouseUp = () => {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  return (
    <main className="container">
      <Header
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={() => navigate(-1)}
        onForward={() => navigate(1)}
        onToggleLeft={() => setIsLeftHidden((hidden) => !hidden)}
        isLeftHidden={isLeftHidden}
        canToggleLeft={Boolean(miniPage)}
      />
      <div
        className={`page-shell ${isAnimeRoute && shouldRenderLeft ? "split" : ""}`}
        ref={containerRef}
        style={
          leftWidth ? ({ ["--split-left" as string]: `${leftWidth}px` } as CSSProperties) : undefined
        }
      >
        {shouldRenderLeft ? (
          <aside className="page-shell__prev">{miniPage}</aside>
        ) : null}
        {shouldRenderLeft ? (
          <div
            className="page-shell__resizer"
            onMouseDown={handleResizeStart}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize panels"
          />
        ) : null}
        <div className="page-shell__main">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

function SearchRoute() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  return query ? <SearchPage query={query} /> : <OngoingPage />;
}

function AnimeRoute() {
  const [params] = useSearchParams();
  const url = params.get("url") || "";
  return url ? <AnimePage url={url} /> : <OngoingPage />;
}

function PlayerRoute() {
  const location = useLocation();
  const state = location.state as { anime?: Anime } | null;
  if (!state?.anime) {
    return <OngoingPage />;
  }
  return <Player anime={state.anime} />;
}

const router = createMemoryRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <OngoingPage /> },
      { path: "/search", element: <SearchRoute /> },
      { path: "/anime", element: <AnimeRoute /> },
      { path: "/player", element: <PlayerRoute /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/favourites", element: <FavouritesPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
