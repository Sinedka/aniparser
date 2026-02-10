import "./App.css";
import {
  RouterProvider,
  createMemoryRouter,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header";
import OngoingPage from "./components/OngoingPage";
import SearchPage from "./components/AnimeSearchPage";
import AnimePage from "./components/AnimePage";
import HistoryPage from "./components/HistoryPage";
import FavouritesPage from "./components/FavouritesPage";
import Player from "./components/player/player";
import { Anime } from "../api/source/Yumme_anime_ru";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  return (
    <main className="container">
      <Header />
      <Outlet />
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
