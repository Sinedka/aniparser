import { Anime } from "../../../api/source/Yumme_anime_ru";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./player.css";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  MuteIcon,
  FullscreenIcon,
  ExitFullscreenIcon,
} from "./icons";

async function getSources(anime: Anime, dubber: string, episode: number) {
  const dubberel =
    anime.dubbers.find((d) => d.dubbing === dubber) || anime.dubbers[0];
  return await (
    dubberel.episodes[episode] || dubberel.episodes[0]
  ).getSources();
}

function Player(props: { anime: Anime }): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [selectedSource, setSelectedSource] = useState<string>("");

  //*Player controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Выбор эпизода по умолчанию при загрузке компонента
  useEffect(() => {
    console.log(props.anime);
    props.anime.dubbers[0].episodes[0].getSources().then((sources) => {
      setSelectedSource(sources[0].url);
    });
  }, [props.anime]);
  // Инициализация HLS плеера при выборе источника
  useEffect(() => {
    if (!selectedSource || !videoRef.current) return;

    // Уничтожаем предыдущий экземпляр Hls, если он существует
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    // Проверяем, является ли источник HLS (m3u8)
    if (selectedSource.includes(".m3u8")) {
      // Проверяем поддержку HLS в браузере
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 300, // Максимальная длина буфера в секундах
          maxMaxBufferLength: 600, // Максимально допустимая длина буфера в секундах
        });

        hls.loadSource(selectedSource);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.error("Ошибка автовоспроизведения:", e));
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("Сетевая ошибка HLS");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("Ошибка медиа HLS");
                hls.recoverMediaError();
                break;
              default:
                console.error("Критическая ошибка HLS:", data);
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Нативная поддержка HLS в Safari
        video.src = selectedSource;
        video.addEventListener("loadedmetadata", () => {
          video
            .play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.error("Ошибка автовоспроизведения:", e));
        });
      }
    } else {
      // Обычное видео
      video.src = selectedSource;
      video.load();
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Ошибка автовоспроизведения:", e));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [selectedSource]);
  // Обработчики событий видео
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    // Обработчик для отслеживания изменения состояния полного экрана
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement
        )
      );
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("ended", handleEnded);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("ended", handleEnded);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  // Форматирование времени (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Управление воспроизведением
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((e) => console.error("Ошибка воспроизведения:", e));
    }
    setIsPlaying(!isPlaying);
  };

  // Перемотка видео
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  // Управление громкостью
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Включение/выключение звука
  const handleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  // Полноэкранный режим
  const handleFullscreen = () => {
    const player = document.querySelector(".player-container");
    if (!player) return;

    if (!isFullscreen) {
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if ((player as any).webkitRequestFullscreen) {
        (player as any).webkitRequestFullscreen();
      } else if ((player as any).msRequestFullscreen) {
        (player as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  return (
    <div className="player-container">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          playsInline
          className="video-player"
          onClick={handlePlayPause}
        />

        <div className="custom-controls">
          <div
            ref={progressRef}
            className="progress-bar-container"
            onClick={handleSeek}
          >
            <div
              className="progress-bar"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>

          <div className="controls-row">
            <button className="control-button" onClick={handlePlayPause}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="volume-control">
              <button className="control-button" onClick={handleMute}>
                {isMuted ? <MuteIcon /> : <VolumeIcon />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <button className="control-button" onClick={handleFullscreen}>
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Player };
