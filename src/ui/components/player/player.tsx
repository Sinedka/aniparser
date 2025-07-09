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
import { SaveManager } from "../../saveManager";
import ActionIcon, { ActionType } from "./ActionIcon";
import KeymapButton from "./KeymapButton";

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
  //PlayerRef
  const videoRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<VideoJsPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const [sources, setSources] = useState<VideoSource[]>([]);
  const [videoParams, setVideoParams] = useState<VideoIDs | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType | null>(null);
  const [actionTimestamp, setActionTimestamp] = useState<number>(0);

  // Регистрация плагина качества
  React.useEffect(() => {
    // Регистрируем плагин качества только один раз
    if (qualitySelector && !videojs.getPlugin("qualitySelector")) {
      qualitySelector(videojs);
    }
    return () => {
      playerRef.current?.dispose();
    };
  }, []);

  //Получаем VideoParams
  React.useEffect(() => {
    const savedVideoParams = SaveManager.getAnimeProgress(
      anime.animeResult.anime_url,
    );
    if (savedVideoParams) {
      setVideoParams({
        player: savedVideoParams.player,
        dubber: savedVideoParams.dubber,
        episode: savedVideoParams.episode,
      });
    } else {
      // Устанавливаем начальные значения, если нет сохраненного прогреса
      setVideoParams({
        player: 0,
        dubber: 0,
        episode: 0,
      });
    }
  }, [anime]);

  // Устанавливаем текущий эпизод
  React.useEffect(() => {
    if (!videoParams) return;
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
      const savedParams = SaveManager.getAnimeProgress(
        anime.animeResult.anime_url,
      );

      if (!savedParams){
        SaveManager.saveAnimeProgress(anime.animeResult.anime_url, {
          player: videoParams.player,
          dubber: videoParams.dubber,
          episode: videoParams.episode,
          time: 0,
        });
      }

      if (
        videoParams.episode !== savedParams.episode ||
        videoParams.player !== savedParams.player ||
        videoParams.dubber !== savedParams.dubber
      ) {
        console.log("Saving new anime progress");
        SaveManager.saveAnimeProgress(anime.animeResult.anime_url, {
          player: videoParams.player,
          dubber: videoParams.dubber,
          episode: videoParams.episode,
          time: 0,
        });
      }

      setSources(videoSources);
    });
  }, [videoParams]);

  // Обновляем useEffect для инициализации плеера
  React.useEffect(() => {
    const settings = SaveManager.getSettings();
    const savedAnimeProgress = SaveManager.getAnimeProgress(
      anime.animeResult.anime_url,
    );

    const options = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: false,
      fill: true,
      // aspectRatio: "16:9",
      playbackRates: [0.5, 1, 1.5, 2],
      sources: sources,
      errorDisplay: false,
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

    function handleGlobalHotkeys(e: KeyboardEvent): void {
      if (!player) return;
      function isTyping(element: EventTarget | null): boolean {
        if (!element) return false;

        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement
        ) {
          return true;
        }

        return false;
      }

      if (isTyping(document.activeElement)) return;

      const updateAction = (action: ActionType) => {
        setCurrentAction(action);
        setActionTimestamp(Date.now());
      };

      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          if (player.paused()) {
            updateAction("play");
            player.play();
          } else {
            updateAction("pause");
            player.pause();
          }
          break;
        case "KeyJ":
          e.preventDefault();
          const currentTimeBack = player.currentTime();
          if (typeof currentTimeBack === "number") {
            updateAction("backward");
            player.currentTime(Math.max(currentTimeBack - 5, 0));
          }
          break;
        case "KeyL":
          e.preventDefault();
          const currentTimeForward = player.currentTime();
          if (typeof currentTimeForward === "number") {
            updateAction("forward");
            player.currentTime(currentTimeForward + 5);
          }
          break;
        case "KeyF":
          e.preventDefault();
          if (
            player.isFullscreen &&
            player.requestFullscreen &&
            player.exitFullscreen
          ) {
            if (player.isFullscreen()) {
              player.exitFullscreen();
            } else {
              player.requestFullscreen();
            }
          }
          break;
        case "KeyM":
          e.preventDefault();
          const isMuted = player.muted();
          if (typeof isMuted === "boolean") {
            updateAction(isMuted ? "unmute" : "mute");
            player.muted(!isMuted);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          const currentVolume = player.volume();
          if (typeof currentVolume === "number") {
            updateAction("volumeUp");
            player.volume(Math.min(currentVolume + 0.1, 1));
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          const newVolume = player.volume();
          if (typeof newVolume === "number") {
            updateAction("volumeDown");
            player.volume(Math.max(newVolume - 0.1, 0));
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          const timeLeft = player.currentTime();
          if (typeof timeLeft === "number") {
            updateAction("backward");
            player.currentTime(Math.max(timeLeft - 5, 0));
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          const timeRight = player.currentTime();
          if (typeof timeRight === "number") {
            updateAction("forward");
            player.currentTime(timeRight + 5);
          }
          break;
        case "BracketLeft":
          e.preventDefault();
          const currentRate = player.playbackRate();
          if (typeof currentRate === "number") {
            updateAction("speedDown");
            player.playbackRate(Math.max(currentRate - 0.25, 0.5));
          }
          break;
        case "BracketRight":
          e.preventDefault();
          const newRate = player.playbackRate();
          if (typeof newRate === "number") {
            updateAction("speedUp");
            player.playbackRate(Math.min(newRate + 0.25, 2));
          }
          break;
      }
    }

    function clearProgressInterval() {
      console.log("Clearing progress interval");
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    if (!playerRef.current) {
      if (sources.length === 0) return;
      const videoElement = document.createElement("video-js");

      if (!videoRef.current) return;

      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, options, () => {
        const player = playerRef.current;
        if (!player) return;
        player.ready(() => {
          setIsPlayerReady(true);
          // Устанавливаем громкость и состояние mute
          player.volume(settings.volume);
          player.muted(settings.isMuted);

          player.on("error", function () {
            player.removeClass("vjs-error");
          });

          // Добавляем слушатели событий
          player.on("ratechange", () => {
            const newRate = player.playbackRate();
            newRate != null && SaveManager.setPlaybackSpeed(newRate);
          });

          player.on("volumechange", () => {
            const newVolume = player.volume();
            const isMuted = player.muted();
            newVolume != null && SaveManager.setVolume(newVolume);
            isMuted != null && SaveManager.setMuted(isMuted);
          });

          document.addEventListener("keydown", handleGlobalHotkeys, true);

          player.on("dispose", () => {
            document.removeEventListener("keydown", handleGlobalHotkeys, true);
            clearProgressInterval();
          });
        });
      });
    }

    const player = playerRef.current;

    if (player && typeof player.paused === "function") {
      player.src(options.sources);

      function SaveTime() {
        if (videoParams) {
          const animeUrl = anime.animeResult.anime_url || "";
          const currentTime = player.currentTime();

          if (currentTime != null && currentTime > 0) {
            SaveManager.saveAnimeProgress(animeUrl, {
              player: videoParams.player,
              dubber: videoParams.dubber,
              episode: videoParams.episode,
              time: currentTime,
            });
          }
        }
      }

      function SaveTimeNotPaused() {
        if (videoParams && !player.paused()) {
          SaveTime();
        }
      }

      player.off("pause", SaveTime);
      player.on("pause", SaveTime);

      clearProgressInterval();
      progressInterval.current = setInterval(SaveTimeNotPaused, 1000);
    }

    function setMetaDataSettings() {
      player.playbackRate(settings.playbackSpeed);
      player.currentTime(savedAnimeProgress?.time || 0);
      player.off("loadedmetadata", setMetaDataSettings);
    }

    player.on("loadedmetadata", setMetaDataSettings);
  }, [sources]);

  return (
    <div className="video-container" data-vjs-player ref={playerContainerRef}>
      <div ref={videoRef} className="video-container" />
      {currentAction && (
        <ActionIcon
          action={currentAction}
          timestamp={actionTimestamp}
          volume={playerRef.current?.volume()}
          player={playerRef.current}
        />
      )}
      {isPlayerReady && videoParams && playerRef.current && (
        <>
          <KeymapButton player={playerRef.current} />
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
