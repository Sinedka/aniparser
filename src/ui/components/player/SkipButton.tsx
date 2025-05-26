import React, { useCallback, useEffect, useState, useRef } from "react";
import { Anime } from "../../../api/source/Yumme_anime_ru";
import { VideoIDs } from "./types";
import "./SkipButton.css";
import ReactDOM from "react-dom";

interface SkipButtonProps {
  player: any; // VideoJS player
  anime: Anime;
  videoParams: VideoIDs;
}

const SkipButton: React.FC<SkipButtonProps> = ({
  player,
  anime,
  videoParams,
}) => {
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [skipButtonHidden, setSkipButtonHidden] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Функция для пропуска опенинга
  const handleSkip = useCallback(() => {
    const currentEpisode =
      anime.players[videoParams.player].dubbers[videoParams.dubber].episodes[
        videoParams.episode
      ];
    const skipInfo = currentEpisode.video.skips;
    if (skipInfo?.opening) {
      const skipStartTime = parseInt(skipInfo.opening.time);
      const skipLength = parseInt(skipInfo.opening.length);
      player.currentTime(skipStartTime + skipLength);
      handleHideButton();
    }
  }, [anime, videoParams, player]);

  // Функция для скрытия кнопки с анимацией
  const handleHideButton = useCallback(() => {
    setIsExiting(true);
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
    }
    exitTimeoutRef.current = setTimeout(() => {
      setShowSkipButton(false);
      setIsExiting(false);
    }, 300); // Время должно совпадать с длительностью анимации в CSS
  }, []);

  // Функция для скрытия кнопки
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSkipButtonHidden(true);
      handleHideButton();
    },
    [handleHideButton]
  );

  // Обработчик времени для показа/скрытия кнопки пропуска
  const handleTimeUpdate = useCallback(() => {
    const currentTime = player.currentTime();
    const currentEpisode =
      anime.players[videoParams.player].dubbers[videoParams.dubber].episodes[
        videoParams.episode
      ];
    const skipInfo = currentEpisode.video.skips;

    if (skipInfo?.opening && typeof currentTime === "number") {
      const skipStartTime = parseInt(skipInfo.opening.time);
      const skipLength = parseInt(skipInfo.opening.length);

      if (
        currentTime >= skipStartTime &&
        currentTime < skipStartTime + skipLength
      ) {
        if (!showSkipButton && !skipButtonHidden) {
          setIsExiting(false);
          setShowSkipButton(true);
        }
      } else {
        if (showSkipButton) {
          handleHideButton();
        }
        setSkipButtonHidden(false);
      }
    }
  }, [
    anime,
    videoParams,
    player,
    skipButtonHidden,
    showSkipButton,
    handleHideButton,
  ]);

  useEffect(() => {
    // Добавляем обработчик обновления времени
    player.on("timeupdate", handleTimeUpdate);

    // Очищаем обработчик при размонтировании или изменении зависимостей
    return () => {
      player.off("timeupdate", handleTimeUpdate);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [player, handleTimeUpdate]);

  // Сбрасываем состояние кнопки при смене эпизода
  useEffect(() => {
    setShowSkipButton(false);
    setSkipButtonHidden(false);
    setIsExiting(false);
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
    }
  }, [videoParams]);

  if (!showSkipButton && !isExiting) {
    return null;
  }

  const button = (
    <div className={`skip-button-container ${isExiting ? "exit" : "enter"}`}>
      <button className="skip-button" onClick={handleSkip}>
        <span>Пропустить опенинг</span>
        <div className="skip-button-close" onClick={handleClose}>
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </div>
      </button>
    </div>
  );

  // Получаем элемент плеера
  const playerEl = player.el();

  // Рендерим кнопку внутри плеера для корректной работы в полноэкранном режиме
  return ReactDOM.createPortal(button, playerEl);
};

export default SkipButton;
