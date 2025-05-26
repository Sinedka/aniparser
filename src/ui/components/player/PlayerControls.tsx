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
    })
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
