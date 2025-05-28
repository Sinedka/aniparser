import { Anime } from "../../../api/source/Yumme_anime_ru";
import { useRef, useState, useEffect } from "react";
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
  const [videoParams, setVideoParams] = useState<VideoIDs | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Регистрация плагина качества
  React.useEffect(() => {
    // Регистрируем плагин качества только один раз
    if (qualitySelector && !videojs.getPlugin("qualitySelector")) {
      qualitySelector(videojs);
    }
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
      // Устанавливаем начальные значения, если нет сохраненного прогресса
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
      setSources(videoSources);
      const oldParams = SaveManager.getAnimeProgress(
        anime.animeResult.anime_url,
      );
      if (
        oldParams?.dubber != videoParams.dubber ||
        oldParams?.episode != videoParams.episode ||
        oldParams?.player != videoParams.player
      ) {
        SaveManager.saveAnimeProgress(anime.animeResult.anime_url, {
          player: videoParams.player,
          dubber: videoParams.dubber,
          episode: videoParams.episode,
          time: 0,
        });
      }
    });
  }, [videoParams]);

  // Обновляем useEffect для инициализации плеера
  React.useEffect(() => {
    const settings = SaveManager.getSettings();

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

    if (!playerRef.current) {
      if (sources.length === 0) return;
      const videoElement = document.createElement("video-js");

      if (!videoRef.current) return;

      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, options, () => {
        const player = playerRef.current;
        if (player) {
          player.ready(() => {
            setIsPlayerReady(true);
            // Устанавливаем громкость и состояние mute
            player.volume(settings.volume);
            player.muted(settings.isMuted);

            // Устанавливаем скорость после загрузки метаданных
            player.one("loadedmetadata", () => {
              player.playbackRate(settings.playbackSpeed);
              if (
                SaveManager.getAnimeProgress(anime.animeResult.anime_url)?.time
              ) {
                player.currentTime(
                  SaveManager.getAnimeProgress(anime.animeResult.anime_url)
                    ?.time || 0,
                );
              }
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
          });
        }
      });
    }

    const player = playerRef.current;
    if (player && typeof player.paused === "function") {
      player.src(options.sources);

      function SaveTime() {
        if (videoParams) {
          const animeUrl = anime.animeResult.anime_url || "";
          const currentTime = player.currentTime();

          if (currentTime != null) {
            SaveManager.saveAnimeProgress(animeUrl, {
              player: videoParams.player,
              dubber: videoParams.dubber,
              episode: videoParams.episode,
              time: currentTime,
            });
          }
        }
      }

      function clearProgressInterval() {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }

      player.off("play", SaveTime);
      player.on("pause", SaveTime);

      clearProgressInterval();

      player.off("dispose", clearProgressInterval);
      player.on("dispose", clearProgressInterval);

      function SaveTimeNotPaused() {
        if (videoParams && !player.paused()) {
          SaveTime();
        }
      }

      progressInterval.current = setInterval(SaveTimeNotPaused, 10000);
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
      {isPlayerReady && videoParams && (
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
