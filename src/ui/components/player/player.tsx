import { Anime } from "../../../api/source/Yumme_anime_ru";
import { useRef, useState } from "react";
import { VideoIDs } from "./types";
import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import "@silvermine/videojs-quality-selector/dist/css/quality-selector.css";
import "./player.css";
import PlayerControls from "./PlayerControls";
import SkipButton from "./SkipButton";

// Импорт плагина качества видео для TypeScript
// @ts-ignore - для обхода проблем типизации внешнего плагина
import qualitySelector from "@silvermine/videojs-quality-selector";

// Определение типов для VideoJS
type VideoJsPlayer = ReturnType<typeof videojs>;

// Типы для источников видео
interface VideoSource {
  src: string;
  type: string;
  label?: string;
  selected?: boolean;
}

function Player({ anime }: { anime: Anime }): React.ReactElement {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const videoRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<VideoJsPlayer | null>(null);
  const [videoParams, setVideoParams] = useState<VideoIDs>({
    player: 0,
    dubber: 0,
    episode: 0,
  });
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Регистрация плагина качества
  React.useEffect(() => {
    // Регистрируем плагин качества только один раз
    if (qualitySelector && !videojs.getPlugin("qualitySelector")) {
      qualitySelector(videojs);
    }
  }, []);

  // Устанавливаем текущий эпизод
  React.useEffect(() => {
    // Получаем источники видео из аниме
    const currentEpisode =
      anime.players[videoParams.player].dubbers[videoParams.dubber].episodes[
        videoParams.episode
      ];

    currentEpisode.getSources().then((sources) => {
      // Создаем источники с метками качества
      const videoSources = sources.map((source, index) => {
        return {
          src: source.url,
          type: "application/x-mpegURL", // TODO: Определять правильный тип
          label: source.title,
          selected: index === sources.length - 1,
        };
      });
      setSources(videoSources);
    });
  }, [videoParams, anime]);

  // Получаем источники видео из аниме
  React.useEffect(() => {
    const options = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: false,
      fill: true,
      aspectRatio: "16:9",
      playbackRates: [0.5, 1, 1.5, 2],
      sources: sources,
      controlBar: {
        children: [
          "playToggle",
          "volumePanel",
          "progressControl",
          "playbackRateMenuButton",
          "qualitySelector",
          "pictureInPictureToggle",
          "fullscreenToggle",
        ],
      },
    };

    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js");

      if (!videoRef.current) {
        console.error("IDK");
        return;
      }
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, options, () => {
        videojs.log("player is ready");
      });
    } else {
      const player = playerRef.current;

      if (player) {
        player.src(options.sources);
      }
    }
  }, [sources, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div className="video-container" data-vjs-player ref={playerContainerRef}>
      <div ref={videoRef} className="video-container" />
      {playerRef.current && (
        <>
          <SkipButton
            player={playerRef.current}
            anime={anime}
            videoParams={videoParams}
          />
          <PlayerControls
            player={playerRef.current}
            SetVideoParams={setVideoParams}
            videoParams={videoParams}
            anime={anime}
          />
        </>
      )}
    </div>
  );
}

export default Player;
