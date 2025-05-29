import React, { useEffect, useRef, useState } from "react";
import { Anime } from "../../../api/source/Yumme_anime_ru";
import { VideoIDs } from "./types";
import "./playerControls.css";
import CustomSelect from "./CustomSelect";
import ReactDOM from "react-dom";

type PlayerControlsProps = {
  player: any;
  SetVideoParams: (videoParams: VideoIDs) => void;
  videoParams: VideoIDs;
  anime: Anime;
};

// Компонент для размещения дополнительных кнопок управления плеером
const PlayerControls: React.FC<PlayerControlsProps> = ({
  player,
  SetVideoParams,
  videoParams,
  anime,
}) => {
  const controlsRef = useRef<HTMLDivElement>(null);
  const [isPlayerSelectActive, setIsPlayerSelectActive] = useState(false);
  const [isDubberSelectActive, setIsDubberSelectActive] = useState(false);
  const [isEpisodeSelectActive, setIsEpisodeSelectActive] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(true);
  const playerSelectRef = useRef<HTMLDivElement>(null);
  const dubberSelectRef = useRef<HTMLDivElement>(null);
  const episodeSelectRef = useRef<HTMLDivElement>(null);

  const handlePlayerChange = (value: number) => {
    SetVideoParams({
      player: value,
      dubber: videoParams.dubber,
      episode: videoParams.episode,
    });
  };

  function fullActive() {
    return (
      isPlayerSelectActive || isDubberSelectActive || isEpisodeSelectActive
    );
  }

  const handleDubberChange = (value: number) => {
    SetVideoParams({
      player: videoParams.player,
      dubber: value,
      episode: videoParams.episode,
    });
  };

  const handleEpisodeChange = (value: number) => {
    SetVideoParams({
      player: videoParams.player,
      dubber: videoParams.dubber,
      episode: value,
    });
  };

  useEffect(() => {
    if (!controlsRef.current || !player || !anime?.players?.length) return;

    const controlsEl = controlsRef.current;

    if (fullActive() || isPlayerActive) {
      controlsEl.style.transform = "translateY(0)";
    } else {
      controlsEl.style.transform = "translateY(-150%)";
    }
  }, [fullActive(), isPlayerActive]);

  useEffect(() => {
    player.on("useractive", () => setIsPlayerActive(true));
    player.on("userinactive", () => setIsPlayerActive(false));
    return () => {
      player.off("useractive", () => setIsPlayerActive(false));
      player.off("userinactive", () => setIsPlayerActive(false));
    };
  }, [player]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const COMMA_KEY = 188; // Код клавиши ","
      const DOT_KEY = 190; // Код клавиши "."

      const currentEpisodes =
        anime.players[videoParams.player].dubbers[videoParams.dubber].episodes;
      const maxEpisodes = currentEpisodes.length - 1;
      const currentDubbers = anime.players[videoParams.player].dubbers;
      const maxDubbers = currentDubbers.length - 1;
      const maxPlayers = anime.players.length - 1;

      // Используем which вместо keyCode для более надежной работы с модификаторами
      const keyPressed = event.which;

      if (event.ctrlKey) {
        // Переключение плеера
        if (keyPressed === DOT_KEY) {
          // Следующий плеер
          const nextPlayer = Math.min(videoParams.player + 1, maxPlayers);
          if (nextPlayer !== videoParams.player) {
            handlePlayerChange(nextPlayer);
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (keyPressed === COMMA_KEY) {
          // Предыдущий плеер
          const prevPlayer = Math.max(videoParams.player - 1, 0);
          if (prevPlayer !== videoParams.player) {
            handlePlayerChange(prevPlayer);
          }
          event.preventDefault();
          event.stopPropagation();
        }
      } else if (event.shiftKey) {
        // Переключение озвучки
        if (keyPressed === DOT_KEY) {
          // Следующая озвучка
          const nextDubber = Math.min(videoParams.dubber + 1, maxDubbers);
          if (nextDubber !== videoParams.dubber) {
            handleDubberChange(nextDubber);
          }
          event.preventDefault();
          event.stopPropagation();
        } else if (keyPressed === COMMA_KEY) {
          // Предыдущая озвучка
          const prevDubber = Math.max(videoParams.dubber - 1, 0);
          if (prevDubber !== videoParams.dubber) {
            handleDubberChange(prevDubber);
          }
          event.preventDefault();
          event.stopPropagation();
        }
      } else {
        // Переключение эпизодов
        if (keyPressed === DOT_KEY) {
          // Следующий эпизод
          const nextEpisode = Math.min(videoParams.episode + 1, maxEpisodes);
          if (nextEpisode !== videoParams.episode) {
            handleEpisodeChange(nextEpisode);
          }
        } else if (keyPressed === COMMA_KEY) {
          // Предыдущий эпизод
          const prevEpisode = Math.max(videoParams.episode - 1, 0);
          if (prevEpisode !== videoParams.episode) {
            handleEpisodeChange(prevEpisode);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress, true);
    return () => {
      document.removeEventListener("keydown", handleKeyPress, true);
    };
  }, [
    videoParams,
    anime,
    handlePlayerChange,
    handleDubberChange,
    handleEpisodeChange,
  ]);

  if (!anime?.players?.length) {
    return null;
  }

  const PlayerSelectOptions = anime.players.map((player, index) => ({
    value: index,
    label: player.name,
  }));

  const DubberSelectOptions = anime.players[videoParams.player].dubbers.map(
    (dubber, index) => ({
      value: index,
      label: dubber.dubbing,
    }),
  );

  const EpisodeSelectOptions = anime.players[videoParams.player].dubbers[
    videoParams.dubber
  ].episodes.map((episode, index) => ({
    value: index,
    label: `Эпизод ${episode.video.number}`,
  }));

  const controls = (
    <div ref={controlsRef} className="player-custom-controls">
      <CustomSelect
        ref={playerSelectRef}
        options={PlayerSelectOptions}
        value={videoParams.player}
        onChange={handlePlayerChange}
        className="player-select"
        onActiveChange={setIsPlayerSelectActive}
        closeOnRefs={[dubberSelectRef, episodeSelectRef]}
      />
      <CustomSelect
        ref={dubberSelectRef}
        options={DubberSelectOptions}
        value={videoParams.dubber}
        onChange={handleDubberChange}
        className="dubber-select"
        onActiveChange={setIsDubberSelectActive}
        closeOnRefs={[playerSelectRef, episodeSelectRef]}
      />
      <CustomSelect
        ref={episodeSelectRef}
        options={EpisodeSelectOptions}
        value={videoParams.episode}
        onChange={handleEpisodeChange}
        className="episode-select"
        onActiveChange={setIsEpisodeSelectActive}
        closeOnRefs={[playerSelectRef, dubberSelectRef]}
      />
    </div>
  );

  // Получаем элемент плеера
  const playerEl = player.el();

  // Рендерим элементы управления внутри плеера для корректной работы в полноэкранном режиме
  return ReactDOM.createPortal(controls, playerEl);
};

export default PlayerControls;
