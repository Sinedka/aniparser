import React, { useEffect, useRef, useState } from "react";
import { Anime } from "../../api/source/Yumme_anime_ru";
import { Episode } from "../../api/source/Yumme_anime_ru";
import Hls from "hls.js";
import { Video, SkipData } from "../../api/source/yummi_anime_types";
import "./player.css";

const bestDubbers = ["Anilibria", "AniDub"];
const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// Функции для работы с глобальной скоростью воспроизведения
function saveGlobalPlaybackSpeed(speed: number): void {
  try {
    localStorage.setItem("globalPlaybackSpeed", speed.toString());
  } catch (error) {
    console.error("Ошибка при сохранении скорости воспроизведения:", error);
  }
}

function loadGlobalPlaybackSpeed(): number {
  try {
    const savedSpeed = localStorage.getItem("globalPlaybackSpeed");
    if (savedSpeed) {
      const speed = parseFloat(savedSpeed);
      // Проверяем, что скорость находится в допустимом диапазоне
      if (playbackSpeeds.includes(speed)) {
        return speed;
      }
    }
    return 1; // Значение по умолчанию
  } catch (error) {
    console.error("Ошибка при загрузке скорости воспроизведения:", error);
    return 1;
  }
}

// Интерфейс для хранения прогресса просмотра
interface WatchProgress {
  animeUrl: string;
  episodeIndex: number;
  currentTime: number;
  dubbing: string;
  lastWatched: number; // timestamp
}

function getAvailableDubbings(episode: Episode): string[] {
  const dubbings: string[] = [];
  episode.episodeData.videos.forEach((video) => {
    dubbings.push(video.data.dubbing);
  });
  return dubbings;
}

function getVideoByDubbing(episode: Episode, dubbing: string): Video {
  for (const video of episode.episodeData.videos) {
    if (video.data.dubbing === dubbing) {
      return video;
    }
  }
  return episode.episodeData.videos[0];
}

// Функция для сохранения прогресса просмотра
function saveWatchProgress(
  anime: Anime,
  episodeIndex: number,
  currentTime: number,
  dubbing: string
): void {
  // Сохраняем время на 10 секунд меньше, но не меньше 0
  const adjustedTime = Math.max(0, currentTime - 10);

  const progress: WatchProgress = {
    animeUrl: anime.animeResult.anime_url,
    episodeIndex,
    currentTime: adjustedTime,
    dubbing,
    lastWatched: Date.now(),
  };

  try {
    // Получаем текущий список сохраненного прогресса
    const savedProgressList = localStorage.getItem("watchProgress");
    let progressList: WatchProgress[] = [];

    if (savedProgressList) {
      progressList = JSON.parse(savedProgressList);
      // Обновляем или добавляем новый прогресс
      const existingIndex = progressList.findIndex(
        (p) => p.animeUrl === anime.animeResult.anime_url
      );
      if (existingIndex !== -1) {
        progressList[existingIndex] = progress;
      } else {
        progressList.push(progress);
      }
    } else {
      progressList = [progress];
    }

    localStorage.setItem("watchProgress", JSON.stringify(progressList));
  } catch (error) {
    console.error("Ошибка при сохранении прогресса:", error);
  }
}

// Функция для загрузки прогресса просмотра
function loadWatchProgress(animeUrl: string): WatchProgress | null {
  try {
    const savedProgressList = localStorage.getItem("watchProgress");
    if (!savedProgressList) return null;

    const progressList: WatchProgress[] = JSON.parse(savedProgressList);
    const progress = progressList.find((p) => p.animeUrl === animeUrl);

    return progress || null;
  } catch (error) {
    console.error("Ошибка при загрузке прогресса:", error);
    return null;
  }
}

function Player(props: { anime: Anime }): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [currentDubbing, setCurrentDubbing] = useState<string>("");
  const [availableDubbings, setAvailableDubbings] = useState<string[]>([]);
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(0);
  const [videoSources, setVideoSources] = useState<
    { title: string; url: string }[]
  >([]);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);

  // Состояния для кастомного плеера
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isFullScreen = useState<boolean>(false)[0];
  const [showControls, setShowControls] = useState<boolean>(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  // Состояние загрузки видео
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Выпадающие меню
  const [showEpisodeMenu, setShowEpisodeMenu] = useState<boolean>(false);
  const [showDubbingMenu, setShowDubbingMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  // Скорость воспроизведения
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(
    loadGlobalPlaybackSpeed()
  );

  // Состояние для пропусков
  const [skips, setSkips] = useState<SkipData[]>([]);
  const [currentSkip, setCurrentSkip] = useState<SkipData | null>(null);

  // Флаг для контроля восстановления прогресса
  const [progressRestored, setProgressRestored] = useState<boolean>(false);

  const [bufferedTime, setBufferedTime] = useState<number>(0);

  useEffect(() => {
    if (props.anime.episodes.length > 0) {
      const dubbings = getAvailableDubbings(
        props.anime.episodes[currentEpisodeIndex]
      );
      setAvailableDubbings(dubbings);

      // Установить озвучку по умолчанию или из сохраненного прогресса
      if (!currentDubbing) {
        // Сначала проверяем сохраненную озвучку
        const savedProgress = props.anime.animeResult.anime_url
          ? loadWatchProgress(props.anime.animeResult.anime_url)
          : null;

        if (savedProgress && dubbings.includes(savedProgress.dubbing)) {
          setCurrentDubbing(savedProgress.dubbing);
        } else {
          // Иначе используем логику выбора лучшей озвучки
          for (const dubber of bestDubbers) {
            if (dubbings.includes(dubber)) {
              setCurrentDubbing(dubber);
              break;
            }
          }

          if (!currentDubbing && dubbings.length > 0) {
            setCurrentDubbing(dubbings[0]);
          }
        }
      }
    }
  }, [props.anime.episodes, currentEpisodeIndex]);

  // Загрузка последнего сохраненного состояния при монтировании компонента
  useEffect(() => {
    if (
      props.anime &&
      props.anime.animeResult &&
      props.anime.animeResult.anime_url &&
      !progressRestored
    ) {
      const savedProgress = loadWatchProgress(
        props.anime.animeResult.anime_url
      );
      if (savedProgress) {
        setCurrentEpisodeIndex(savedProgress.episodeIndex);
        setCurrentDubbing(savedProgress.dubbing);

        // Отложенная установка времени воспроизведения
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.currentTime = savedProgress.currentTime;
            // Устанавливаем глобальную скорость воспроизведения
            videoRef.current.playbackRate = playbackSpeed;
            // Отмечаем, что прогресс был восстановлен
            setProgressRestored(true);
          }
        }, 1000);
      } else {
        // Если нет сохраненного прогресса, также отмечаем как восстановленный
        setProgressRestored(true);
      }
    }
  }, [props.anime, playbackSpeed, progressRestored]);

  // Эффект для периодического сохранения прогресса каждые 5 секунд
  useEffect(() => {
    // Не сохраняем прогресс, пока он не был восстановлен
    if (
      !props.anime ||
      !props.anime.animeResult ||
      !props.anime.animeResult.anime_url ||
      !currentDubbing ||
      !progressRestored
    )
      return;

    const saveInterval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        saveWatchProgress(
          props.anime,
          currentEpisodeIndex,
          currentTime,
          currentDubbing
        );
      }
    }, 5000);

    return () => {
      clearInterval(saveInterval);
      // Сохраняем прогресс при размонтировании компонента
      if (currentTime > 0 && duration > 0) {
        saveWatchProgress(
          props.anime,
          currentEpisodeIndex,
          currentTime,
          currentDubbing
        );
      }
    };
  }, [
    props.anime,
    currentEpisodeIndex,
    currentTime,
    duration,
    currentDubbing,
    progressRestored,
  ]);

  // Сохранение прогресса при паузе видео
  useEffect(() => {
    if (
      !isPlaying &&
      currentTime > 0 &&
      duration > 0 &&
      props.anime.animeResult.anime_url
    ) {
      saveWatchProgress(
        props.anime,
        currentEpisodeIndex,
        currentTime,
        currentDubbing
      );
    }
  }, [isPlaying]);

  // Сохраняем прогресс при смене эпизода
  useEffect(() => {
    if (
      props.anime.animeResult.anime_url &&
      currentDubbing &&
      currentTime > 0 &&
      duration > 0
    ) {
      // Небольшая задержка для уверенности, что текущее время корректно
      const timer = setTimeout(() => {
        saveWatchProgress(
          props.anime,
          currentEpisodeIndex,
          currentTime,
          currentDubbing
        );
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [currentEpisodeIndex]);

  // При выходе со страницы сохраняем прогресс
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        props.anime.animeResult.anime_url &&
        currentDubbing &&
        currentTime > 0
      ) {
        saveWatchProgress(
          props.anime,
          currentEpisodeIndex,
          currentTime,
          currentDubbing
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [props.anime, currentEpisodeIndex, currentTime, currentDubbing]);

  useEffect(() => {
    if (!videoRef.current || !currentDubbing) return;

    const video = videoRef.current;
    const loadVideo = async () => {
      // Устанавливаем состояние загрузки
      setIsLoading(true);

      // Уничтожаем предыдущий экземпляр HLS, если он есть
      if (hlsInstance) {
        hlsInstance.destroy();
      }

      const episode = props.anime.episodes[currentEpisodeIndex];
      const videoObj = getVideoByDubbing(episode, currentDubbing);
      const sources = await Episode.getSources(videoObj);
      setVideoSources(sources);

      // Устанавливаем пропуски для текущего видео
      if (videoObj.skips) {
        setSkips(Object.values(videoObj.skips));
      } else {
        setSkips([]);
      }
      setCurrentSkip(null);

      // Получаем доступные качества
      const qualities = sources
        .map((source) => parseInt(source.title))
        .filter((q) => !isNaN(q));
      setAvailableQualities(qualities);

      // Устанавливаем лучшее качество по умолчанию, если еще не выбрано
      if (currentQuality === 0 || !qualities.includes(currentQuality)) {
        setCurrentQuality(Math.max(...qualities));
      }

      const selectedSource =
        sources.find((s) => parseInt(s.title) === currentQuality) || sources[0];
      const videoSrc = selectedSource.url;

      // Проверяем поддержку HLS
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          startLevel: -1, // Автоматически выбирать начальный уровень
        });

        hls.loadSource(videoSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          // При переключении серии всегда начинаем с начала
          video.currentTime = 0;

          // Автоматическое воспроизведение только после загрузки
          video.play().catch((err) => {
            console.warn("Автовоспроизведение не удалось:", err);
            // Браузеры часто блокируют автовоспроизведение со звуком
            // Попробуем воспроизвести без звука и затем включить звук
            video.muted = true;
            video
              .play()
              .then(() => {
                // Если начали воспроизведение
                setIsPlaying(true);
              })
              .catch((err) => {
                console.error(
                  "Автовоспроизведение без звука тоже не удалось:",
                  err
                );
              });
          });
        });

        // Сохраняем экземпляр HLS для дальнейшего использования
        setHlsInstance(hls);
      }
      // Для Safari, который поддерживает HLS нативно
      else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoSrc;
        // При переключении серии всегда начинаем с начала
        video.currentTime = 0;

        // Автоматическое воспроизведение только после загрузки
        video.play().catch((err) => {
          console.warn("Автовоспроизведение не удалось:", err);
          video.muted = true;
          video
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.error(
                "Автовоспроизведение без звука тоже не удалось:",
                err
              );
            });
        });
      } else {
        console.error("Ваш браузер не поддерживает воспроизведение HLS видео");
      }

      // Восстанавливаем скорость воспроизведения после смены источника
      video.playbackRate = playbackSpeed;
    };

    loadVideo();

    return () => {
      // Очистка при размонтировании компонента
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [currentEpisodeIndex, currentDubbing, currentQuality]);

  // Эффект для обновления скорости воспроизведения при её изменении
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;

    // Сохраняем глобальную скорость воспроизведения
    saveGlobalPlaybackSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Эффект для добавления слушателей событий видео
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Обработчики событий видео
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onDurationChange = () => {
      setDuration(video.duration);
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (currentEpisodeIndex < props.anime.episodes.length - 1) {
        // Автоматический переход к следующей серии
        const nextIndex = currentEpisodeIndex + 1;
        setCurrentEpisodeIndex(nextIndex);
        // Сбрасываем текущее время при переходе к следующей серии
        setCurrentTime(0);

        // Пытаемся автоматически запустить следующее видео
        setTimeout(() => {
          if (videoRef.current) {
            // Явно устанавливаем время воспроизведения в 0
            videoRef.current.currentTime = 0;
            videoRef.current
              .play()
              .catch((err) =>
                console.error(
                  "Ошибка при автовоспроизведении следующей серии:",
                  err
                )
              );
          }
        }, 500);
      }
    };

    const onRateChange = () => {
      setPlaybackSpeed(video.playbackRate);
    };

    // Добавляем обработчики для событий загрузки
    const onLoadStart = () => {
      setIsLoading(true);
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onWaiting = () => {
      setIsLoading(true);
    };

    // Добавляем обработчик для отслеживания буферизации
    const onProgress = () => {
      if (video.buffered.length > 0) {
        // Берем самый последний временной диапазон из буфера
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferedTime(bufferedEnd);
      }
    };

    // Добавляем слушатели
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ended", onEnded);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("loadstart", onLoadStart);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("progress", onProgress);

    // Удаляем слушатели при размонтировании
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("loadstart", onLoadStart);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("progress", onProgress);
    };
  }, [currentEpisodeIndex, props.anime.episodes.length]);

  // Эффект для отслеживания смены источника видео
  useEffect(() => {
    // Сбрасываем состояние воспроизведения при смене источника
    setIsPlaying(false);

    // Обработчик события loadeddata - срабатывает когда видео загрузило данные
    const handleLoaded = () => {
      // Проверяем, есть ли у нас доступ к видео элементу
      if (videoRef.current) {
        // Если видео готово к воспроизведению, обновляем состояние
        if (!videoRef.current.paused) {
          setIsPlaying(true);
        }
      }
    };

    // Добавляем слушатель
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadeddata", handleLoaded);
    }

    // Очистка при размонтировании
    return () => {
      if (video) {
        video.removeEventListener("loadeddata", handleLoaded);
      }
    };
  }, [currentEpisodeIndex, currentDubbing, currentQuality]);

  // Эффект для автоскрытия элементов управления
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    const handleMouseMove = () => {
      setShowControls(true);

      // Удаляем класс скрытия курсора при движении мыши
      container.classList.remove("cursor-hidden");

      // Сбрасываем предыдущий таймер
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }

      // Устанавливаем новый таймер на скрытие элементов управления
      const timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          // Добавляем класс для скрытия курсора
          container.classList.add("cursor-hidden");
        }
      }, 3000);

      setControlsTimeout(timeout);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseenter", handleMouseMove);
    container.addEventListener("mouseleave", () => {
      if (isPlaying) {
        setShowControls(false);
        // Добавляем класс для скрытия курсора
        container.classList.add("cursor-hidden");
      }
    });

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseenter", handleMouseMove);
      container.removeEventListener("mouseleave", () => {
        if (isPlaying) {
          setShowControls(false);
          // Добавляем класс для скрытия курсора при удалении слушателя
          container.classList.add("cursor-hidden");
        }
      });

      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [controlsTimeout, isPlaying]);

  // Эффект для показа курсора при паузе
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!isPlaying) {
      // Показываем курсор и интерфейс при паузе
      setShowControls(true);
      container.classList.remove("cursor-hidden");
    }
  }, [isPlaying]);

  // Эффект для обработки клавиатурных сокращений
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, что не в режиме ввода текста (например, в поле ввода)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video || isLoading) return; // Блокируем воспроизведение при загрузке

      switch (e.code) {
        case "Space": // Пробел для воспроизведения/паузы
          e.preventDefault(); // Предотвращаем прокрутку страницы при нажатии пробела
          // Проверяем напрямую состояние видео вместо использования isPlaying
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }

          // Снимаем фокус с любого элемента, который может быть в фокусе
          if (
            document.activeElement &&
            document.activeElement instanceof HTMLElement
          ) {
            document.activeElement.blur();
          }
          break;
        case "ArrowRight": // Стрелка вправо для перемотки вперед на 10 секунд
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
          break;
        case "ArrowLeft": // Стрелка влево для перемотки назад на 10 секунд
          e.preventDefault();
          video.currentTime = Math.max(video.currentTime - 10, 0);
          break;
        case "KeyM": // M для включения/выключения звука
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF": // F для полноэкранного режима
          e.preventDefault();
          toggleFullScreen();
          break;
        case "Enter": // Enter для пропуска опенинга
          if (currentSkip) {
            e.preventDefault();
            video.currentTime =
              parseFloat(currentSkip.time) + parseFloat(currentSkip.length);
          }
          break;
      }
    };

    // Добавляем слушатель клавиатуры
    document.addEventListener("keydown", handleKeyDown);

    // Удаляем слушатель при размонтировании
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSkip, isLoading]); // Добавляем currentSkip и isLoading в зависимости

  // Добавляем альтернативный обработчик фокуса на контейнере
  useEffect(() => {
    const container = videoContainerRef.current;
    if (!container) return;

    // Обработчик клавиатуры для контейнера с видео
    const handleContainerKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || isLoading) return; // Блокируем воспроизведение при загрузке

      if (e.code === "Space") {
        e.preventDefault();
        // Проверяем напрямую состояние видео вместо использования isPlaying
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }

        // Снимаем фокус с контейнера после обработки
        container.blur();
      }
    };

    // Устанавливаем tabIndex чтобы элемент мог получать фокус
    container.setAttribute("tabIndex", "0");

    // Добавляем слушатель непосредственно на контейнер
    container.addEventListener("keydown", handleContainerKeyDown);

    return () => {
      container.removeEventListener("keydown", handleContainerKeyDown);
    };
  }, [isLoading]);

  // Эффект для проверки пропусков
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !skips.length) return;

    const checkSkips = () => {
      const currentTime = video.currentTime;

      // Проверяем, не закончился ли текущий опенинг
      if (currentSkip) {
        const endTime =
          parseFloat(currentSkip.time) + parseFloat(currentSkip.length);
        if (currentTime > endTime) {
          setCurrentSkip(null);
          return;
        }
      }

      // Ищем новый опенинг
      const skip = skips.find((skip) => {
        const startTime = parseFloat(skip.time);
        const endTime = startTime + parseFloat(skip.length);
        return currentTime >= startTime && currentTime <= endTime;
      });

      if (skip && (!currentSkip || skip.time !== currentSkip.time)) {
        setCurrentSkip(skip);
      }
    };

    video.addEventListener("timeupdate", checkSkips);
    return () => {
      video.removeEventListener("timeupdate", checkSkips);
    };
  }, [skips, currentSkip]);

  // Форматирование времени (сек -> MM:SS)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Функции управления воспроизведением
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || isLoading) return; // Блокируем воспроизведение при загрузке

    // Проверяем напрямую состояние видео вместо использования isPlaying
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressBarRef.current;
    const video = videoRef.current;
    if (!progressBar || !video) return;

    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;

    video.currentTime = newTime;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;

    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
  };

  const toggleFullScreen = () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error(`Ошибка при входе в полноэкранный режим: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Функции для выбора качества, серии и озвучки
  const toggleEpisodeMenu = () => {
    setShowEpisodeMenu(!showEpisodeMenu);
    setShowDubbingMenu(false);
    setShowQualityMenu(false);
    setShowSpeedMenu(false);
  };

  // Добавляем функции для переключения на предыдущую/следующую серию
  const goToPrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      selectEpisode(currentEpisodeIndex - 1);
    }
  };

  const goToNextEpisode = () => {
    if (currentEpisodeIndex < props.anime.episodes.length - 1) {
      selectEpisode(currentEpisodeIndex + 1);
    }
  };

  const toggleDubbingMenu = () => {
    setShowDubbingMenu(!showDubbingMenu);
    setShowEpisodeMenu(false);
    setShowQualityMenu(false);
    setShowSpeedMenu(false);
  };

  const toggleQualityMenu = () => {
    setShowQualityMenu(!showQualityMenu);
    setShowDubbingMenu(false);
    setShowEpisodeMenu(false);
    setShowSpeedMenu(false);
  };

  const toggleSpeedMenu = () => {
    setShowSpeedMenu(!showSpeedMenu);
    setShowQualityMenu(false);
    setShowDubbingMenu(false);
    setShowEpisodeMenu(false);
  };

  const selectEpisode = (index: number) => {
    // Запоминаем предыдущее состояние воспроизведения
    const wasPlaying = isPlaying;

    // При смене серии видео будет остановлено, обновляем состояние
    setIsPlaying(false);

    // Сбрасываем текущее время к нулю при смене серии
    setCurrentTime(0);

    // Сбрасываем флаг восстановления прогресса, так как выбрана новая серия
    setProgressRestored(true);

    // Устанавливаем новый индекс серии
    setCurrentEpisodeIndex(index);
    setShowEpisodeMenu(false);

    // После смены источника пытаемся автоматически продолжить воспроизведение
    if (wasPlaying && videoRef.current) {
      // Используем setTimeout, чтобы дать время на загрузку видео
      setTimeout(() => {
        if (videoRef.current) {
          // Явно устанавливаем время воспроизведения в 0
          videoRef.current.currentTime = 0;
          videoRef.current
            .play()
            .catch((err) =>
              console.error("Ошибка при автовоспроизведении:", err)
            );
        }
      }, 500);
    }
  };

  const selectDubbing = (dubbing: string) => {
    setCurrentDubbing(dubbing);
    setShowDubbingMenu(false);
  };

  const selectQuality = (quality: number) => {
    if (currentQuality === quality) return;

    setCurrentQuality(quality);
    setShowQualityMenu(false);

    // Если используем HLS.js, можно переключить уровень качества без полной перезагрузки
    if (hlsInstance && videoSources) {
      const sources = videoSources;
      const selectedSource = sources.find((s) => parseInt(s.title) === quality);

      if (selectedSource) {
        // Если у нас адаптивный поток с разными уровнями качества в одном манифесте
        const levelIndex = hlsInstance.levels.findIndex(
          (level) =>
            level.height === quality ||
            level.width === quality ||
            level.bitrate === quality
        );

        if (levelIndex !== -1) {
          hlsInstance.currentLevel = levelIndex;
        } else {
          // Если нужно загрузить новый манифест для другого качества
          hlsInstance.loadSource(selectedSource.url);
          hlsInstance.startLoad();
        }
      }
    }
  };

  const selectSpeed = (speed: number) => {
    if (playbackSpeed === speed) return;

    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    // Сохраняем глобальную скорость воспроизведения
    saveGlobalPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // Форматирование скорости для отображения
  const formatSpeed = (speed: number): string => {
    return speed === 1 ? "1.0×" : `${speed}×`;
  };

  return (
    <div className="custom-player">
      <div
        className="video-container"
        ref={videoContainerRef}
        tabIndex={0}
        onKeyDown={(e) => {
          // Добавляем React-обработчик клавиш
          const video = videoRef.current;
          if (!video || isLoading) return; // Блокируем воспроизведение при загрузке

          if (e.code === "Space") {
            e.preventDefault();
            // Проверяем напрямую состояние видео вместо использования isPlaying
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }

            // Снимаем фокус после нажатия
            if (e.currentTarget) {
              e.currentTarget.blur();
            }
          }
        }}
      >
        <video ref={videoRef} onClick={togglePlay} />

        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {/* Показываем сообщение о восстановлении прогресса при наличии сохраненных данных */}
        {currentTime > 10 && (
          <div
            className="resume-notification"
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "4px",
              zIndex: 10,
              fontSize: "14px",
              transition: "opacity 0.3s",
              opacity: currentTime > 10 && currentTime < 20 ? 1 : 0,
            }}
          >
            Просмотр восстановлен с {formatTime(currentTime)}
          </div>
        )}

        {/* Центральная кнопка Play/Pause, отображаем только если не загружается и не воспроизводится */}
        {!isPlaying && !isLoading && (
          <div className="big-play-button" onClick={togglePlay}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        )}

        {/* Кастомные элементы управления */}
        <div className={`custom-controls ${!showControls ? "hidden" : ""}`}>
          {/* Кнопка пропуска опенинга */}
          {currentSkip && (
            <div
              className="skip-button"
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.currentTime =
                    parseFloat(currentSkip.time) +
                    parseFloat(currentSkip.length);
                }
              }}
            >
              Пропустить опенинг
            </div>
          )}

          {/* Прогресс-бар */}
          <div
            className="progress-bar-container"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            {/* Буферизованная часть */}
            <div
              className="buffered-bar"
              style={{ width: `${(bufferedTime / duration) * 100}%` }}
            />
            {/* Просмотренная часть */}
            <div
              className="progress-bar"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Нижний ряд элементов управления */}
          <div className="controls-row">
            <div className="left-controls">
              {/* Предыдущая серия */}
              <button
                className="control-button"
                onClick={goToPrevEpisode}
                disabled={currentEpisodeIndex === 0 || isLoading}
                title="Предыдущая серия"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M6,6h2v12H6V6z M16,6.31v11.38L8.69,12L16,6.31z" />
                </svg>
              </button>

              {/* Play/Pause */}
              <button
                className="control-button"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>

              {/* Следующая серия */}
              <button
                className="control-button"
                onClick={goToNextEpisode}
                disabled={
                  currentEpisodeIndex === props.anime.episodes.length - 1 ||
                  isLoading
                }
                title="Следующая серия"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M18,6h-2v12h2V6z M8,6.31v11.38L15.31,12L8,6.31z" />
                </svg>
              </button>

              {/* Громкость */}
              <div className="volume-control">
                <button className="control-button" onClick={toggleMute}>
                  {isMuted || volume === 0 ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3,9H7L12,4V20L7,15H3V9Z" />
                      <line
                        x1="15"
                        y1="4"
                        x2="23"
                        y2="12"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <line
                        x1="15"
                        y1="20"
                        x2="23"
                        y2="12"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3,9H7L12,4V20L7,15H3V9Z" />
                      <path
                        d="M14,9C14,9 15,10 15,12C15,14 14,15 14,15"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M3,9H7L12,4V20L7,15H3V9Z" />
                      <path
                        d="M14,9C14,9 16,10 16,12C16,14 14,15 14,15"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M17,6C17,6 20,8 20,12C20,16 17,18 17,18"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>

              {/* Время */}
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="middle-controls">
              {/* Выбор серии */}
              <div className="selector">
                <button className="selector-button" onClick={toggleEpisodeMenu}>
                  {currentEpisodeIndex + 1} серия
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M7,10L12,15L17,10H7Z" />
                  </svg>
                </button>

                {showEpisodeMenu && (
                  <div className="dropdown-menu episode-menu">
                    {props.anime.episodes.map((_, index) => (
                      <button
                        key={index}
                        className={`dropdown-item ${
                          index === currentEpisodeIndex ? "active" : ""
                        }`}
                        onClick={() => selectEpisode(index)}
                      >
                        {index + 1} серия
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Выбор озвучки */}
              <div className="selector">
                <button className="selector-button" onClick={toggleDubbingMenu}>
                  {currentDubbing}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M7,10L12,15L17,10H7Z" />
                  </svg>
                </button>

                {showDubbingMenu && (
                  <div className="dropdown-menu">
                    {availableDubbings.map((dubbing, index) => (
                      <button
                        key={index}
                        className={`dropdown-item ${
                          dubbing === currentDubbing ? "active" : ""
                        }`}
                        onClick={() => selectDubbing(dubbing)}
                      >
                        {dubbing}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Выбор качества */}
              <div className="selector">
                <button className="selector-button" onClick={toggleQualityMenu}>
                  {currentQuality}p
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M7,10L12,15L17,10H7Z" />
                  </svg>
                </button>

                {showQualityMenu && (
                  <div className="dropdown-menu">
                    {availableQualities
                      .sort((a, b) => b - a)
                      .map((quality, index) => (
                        <button
                          key={index}
                          className={`dropdown-item ${
                            quality === currentQuality ? "active" : ""
                          }`}
                          onClick={() => selectQuality(quality)}
                        >
                          {quality}p
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="right-controls">
              {/* Скорость воспроизведения */}
              <div className="speed-selector">
                <button className="speed-button" onClick={toggleSpeedMenu}>
                  {formatSpeed(playbackSpeed)}
                </button>

                {showSpeedMenu && (
                  <div className="speed-menu">
                    {playbackSpeeds.map((speed, index) => (
                      <button
                        key={index}
                        className={`speed-item ${
                          speed === playbackSpeed ? "active" : ""
                        }`}
                        onClick={() => selectSpeed(speed)}
                      >
                        {formatSpeed(speed)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Полноэкранный режим */}
              <button className="control-button" onClick={toggleFullScreen}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  {isFullScreen ? (
                    <path d="M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z" />
                  ) : (
                    <path d="M7,14H5V19H10V17H7V14M5,10H7V7H10V5H5V10M17,17H14V19H19V14H17V17M14,5V7H17V10H19V5H14Z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Player };
