import "./body.css";
import { useEffect, useState } from "react";
import { Anime } from "../api/source/Yumme_anime_ru";
import Header from "./components/Header";
import { BodyType, BodyElement } from "./manager";
import OngoingPage from "./components/OngoingPage";

export let handle_esc_key: () => void;
export let handleKeyDown: (event: KeyboardEvent) => void;

export let openAnimePage: (url: string) => void;
export let closeLast: () => void;
export let closeAll: () => void;
export let playAnime: (anime: Anime) => void;
export let searchAnime: (query: string) => void;

let opened = Array<BodyElement>();

export default function GetBody() {
  const [current, setCurrent] = useState<BodyElement | undefined>(undefined);

  useEffect(() => {
    openAnimePage = (url: string) => {
      if (
        opened.length < 1 ||
        opened[opened.length - 1].type != BodyType.Anime ||
        opened[opened.length - 1].value != url
      ) {
        console.log(opened[opened.length - 1]?.value, url, current);
        opened.push(new BodyElement(BodyType.Anime, url));
        setCurrent(opened[opened.length - 1]);
      }
    };
    closeLast = () => {
      if (opened.length > 0) {
        opened.pop();
        if (opened.length > 0) {
          setCurrent(opened[opened.length - 1]);
        } else {
          setCurrent(undefined);
        }
      }
    };
    closeAll = () => {
      opened = [];
      setCurrent(undefined);
    };
    playAnime = (anime: Anime) => {
      opened.push(new BodyElement(BodyType.Player, anime));
      setCurrent(opened[opened.length - 1]);
    };
    handle_esc_key = () => {
      closeLast();
      setCurrent(opened[opened.length - 1]);
    };

    handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handle_esc_key();
      }
    };
    searchAnime = (query: string) => {
      if (
        opened.length < 1 ||
        opened[opened.length - 1].type != BodyType.Search ||
        opened[opened.length - 1].value != query
      ) {
        opened.push(new BodyElement(BodyType.Search, query));
        setCurrent(opened[opened.length - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    // Сброс прокрутки при изменении текущего компонента
    window.scrollTo(0, 0);
  });

  return (
    <>
      <Header />
      {opened.length > 0 ? opened[opened.length - 1].Body : <OngoingPage />}
    </>
  );
}
