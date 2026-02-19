import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Anime } from "../../../api/source/Yumme_anime_ru";
import { VideoIDs } from "./types";
import "./playerControls.top.css";
import "./playerControls.progress.css";
import "./playerControls.bottom.css";
import ReactDOM from "react-dom";
import { BsVolumeDownFill, BsVolumeMuteFill, BsVolumeUpFill } from "react-icons/bs";
import {
  MdFullscreen,
  MdFullscreenExit,
  MdPictureInPictureAlt,
} from "react-icons/md";
import { useSettingsStore } from "../../saveManager";
import { keyStack } from "../../keyboard/KeyStack";

type PlayerControlsProps = {
  player: any;
  SetVideoParams: (videoParams: VideoIDs) => void;
  videoParams: VideoIDs;
  anime: Anime;
  sources: { src: string; type: string; label?: string; selected?: boolean }[];
};

const StackedSelect: React.FC<{
  options: { value: number; label: string }[];
  value: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: number) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
}> = ({ options, value, isOpen, onToggle, onChange, rootRef }) => {
  const SELECT_ROW_HEIGHT = 40;
  const SELECT_MAX_VISIBLE = 9;
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<number, HTMLButtonElement>());
  const searchRef = useRef<HTMLInputElement>(null);
  const [closedOffset, setClosedOffset] = useState(-120);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [query, setQuery] = useState("");
  const [tempValue, setTempValue] = useState<number | null>(null);
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized),
    );
  }, [options, query]);
  const visibleCount = Math.min(filteredOptions.length, SELECT_MAX_VISIBLE);
  const listHeight = SELECT_ROW_HEIGHT * Math.max(1, visibleCount);

  const displayValue = isOpen && tempValue !== null ? tempValue : value;

  useEffect(() => {
    const listEl = listRef.current;
    const optionEl = optionRefs.current.get(displayValue);
    if (!listEl || !optionEl) return;
    const viewportHeight = listHeight;
    const optionHeight = optionEl.offsetHeight || SELECT_ROW_HEIGHT;

    if (isOpen && tempValue !== null) {
      const top = listEl.scrollTop;
      const bottom = top + viewportHeight;
      const optionTop = optionEl.offsetTop;
      const optionBottom = optionTop + optionHeight;
      if (optionTop < top) {
        listEl.scrollTo({ top: optionTop });
      } else if (optionBottom > bottom) {
        listEl.scrollTo({ top: optionBottom - viewportHeight });
      }
      return;
    }

    const scrollHeight = listEl.scrollHeight || viewportHeight;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    const centered =
      optionEl.offsetTop - (viewportHeight / 2 - optionHeight / 2);
    const target = Math.min(Math.max(0, centered), maxScroll);
    listEl.scrollTo({ top: target });

    const offset = -(optionEl.offsetTop - target);
    const minOffset = -(viewportHeight - optionHeight);
    const clampedOffset = Math.min(0, Math.max(minOffset, offset));
    setClosedOffset(clampedOffset);
  }, [
    displayValue,
    filteredOptions.length,
    listHeight,
    isOpen,
    tempValue,
    SELECT_ROW_HEIGHT,
  ]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return () => { };
    const handler = (event: KeyboardEvent) => {
      if (document.activeElement !== searchRef.current) return;
      if (event.code === "ArrowDown" || event.code === "ArrowUp") {
        event.preventDefault();
        const currentIndex = filteredOptions.findIndex(
          (option) => option.value === (tempValue ?? value),
        );
        const startIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex =
          event.code === "ArrowDown"
            ? Math.min(startIndex + 1, filteredOptions.length - 1)
            : Math.max(startIndex - 1, 0);
        const nextOption = filteredOptions[nextIndex];
        if (nextOption) setTempValue(nextOption.value);
      } else if (event.code === "Enter") {
        event.preventDefault();
        const nextValue =
          tempValue ??
          filteredOptions.find((option) => option.value === value)?.value ??
          filteredOptions[0]?.value;
        if (typeof nextValue === "number") onChange(nextValue);
        onToggle();
      } else if (event.code === "Escape") {
        event.preventDefault();
        onToggle();
      }
    };

    const unsubs = [
      keyStack.subscribe("ArrowDown", handler),
      keyStack.subscribe("ArrowUp", handler),
      keyStack.subscribe("Enter", handler),
      keyStack.subscribe("Escape", handler),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isOpen, filteredOptions, tempValue, value, onChange, onToggle]);

  useEffect(() => {
    if (!isOpen) return;
    setTempValue(value);
    const raf = requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="stacked-select-wrap">
      <div className={`stacked-select-search ${isOpen ? "show" : ""}`}>
        <input
          ref={searchRef}
          type="text"
          placeholder="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
      <div
        className={`stacked-select ${isOpen ? "open" : ""} ${hasInteracted ? "" : "no-anim"
          }`}
        style={
          {
            "--stacked-closed-offset": `${closedOffset}px`,
            "--stacked-list-height": `${listHeight}px`,
            "--stacked-collapsed-height": `${SELECT_ROW_HEIGHT}px`,
          } as React.CSSProperties
        }
        onClick={
          !isOpen
            ? () => {
              if (!hasInteracted) setHasInteracted(true);
              onToggle();
            }
            : undefined
        }
      >
        <div className="stacked-select-viewport">
          <div className="stacked-select-scroll" ref={listRef}>
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                ref={(el) => {
                  if (el) {
                    optionRefs.current.set(option.value, el);
                  } else {
                    optionRefs.current.delete(option.value);
                  }
                }}
                className={`stacked-select-option ${option.value === value ? "active" : ""
                  } ${isOpen && tempValue === option.value ? "keyboard" : ""}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isOpen) {
                    if (!hasInteracted) setHasInteracted(true);
                    onToggle();
                    return;
                  }
                  onChange(option.value);
                  onToggle();
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTime = (time: number) => {
  if (!Number.isFinite(time) || time < 0) return "0:00";
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const PlayerControls: React.FC<PlayerControlsProps> = ({
  player,
  SetVideoParams,
  videoParams,
  anime,
  sources,
}) => {
  const controlsRef = useRef<HTMLDivElement>(null);
  const [isPlayerMenuOpen, setIsPlayerMenuOpen] = useState(false);
  const [isDubberMenuOpen, setIsDubberMenuOpen] = useState(false);
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityIndex, setQualityIndex] = useState(0);
  const [seekValue, setSeekValue] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const showRemainingTime = useSettingsStore(
    (state) => state.settings.showRemainingTime,
  );
  const setShowRemainingTimeSetting = useSettingsStore(
    (state) => state.setShowRemainingTime,
  );
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const [isTimeDisplayFocused, setIsTimeDisplayFocused] = useState(false);
  const isSeekingRef = useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const seekStartXRef = useRef<number | null>(null);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const volumeStartXRef = useRef<number | null>(null);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const isProgressHoldRef = useRef(false);

  const playerMenuRef = useRef<HTMLDivElement>(null);
  const dubberMenuRef = useRef<HTMLDivElement>(null);
  const episodeMenuRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);

  const playbackRates = useMemo(() => [0.5, 0.75, 1, 1.25, 1.5, 2], []);
  const speedOptions = useMemo(
    () =>
      playbackRates.map((rate, index) => ({
        value: index,
        label: `${rate}x`,
      })),
    [playbackRates],
  );
  const currentSpeedIndex = Math.max(
    0,
    playbackRates.findIndex((rate) => rate === playbackRate),
  );

  const handlePlayerChange = (value: number) => {
    SetVideoParams({
      player: value,
      dubber: videoParams.dubber,
      episode: videoParams.episode,
    });
  };

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

  const handleQualityChange = (value: number) => {
    const selectedSource = sources[value];
    if (!player || !selectedSource) return;
    const resumeTime = player.currentTime?.() || 0;
    const shouldPlay = !player.paused?.();
    setQualityIndex(value);
    setBufferedTime(0);
    isProgressHoldRef.current = true;
    setCurrentTime(resumeTime);
    setSeekValue(resumeTime);
    player.src(selectedSource);
    const restore = () => {
      player.currentTime?.(resumeTime);
      if (shouldPlay) player.play?.();
      isProgressHoldRef.current = false;
      player.off?.("loadedmetadata", restore);
    };
    player.on?.("loadedmetadata", restore);
  };

  const handleSpeedChange = (value: number) => {
    const rate = playbackRates[value] ?? 1;
    player.playbackRate?.(rate);
  };

  const isControlsActive =
    isPlayerMenuOpen ||
    isDubberMenuOpen ||
    isEpisodeMenuOpen ||
    isSpeedMenuOpen ||
    isQualityMenuOpen ||
    isPlayerActive ||
    isSeeking;

  useEffect(() => {
    if (!controlsRef.current) return;
    const controlsEl = controlsRef.current;
    controlsEl.classList.toggle("active", isControlsActive);
  }, [isControlsActive]);

  useEffect(() => {
    if (!player) return;

    const handleUserActive = () => setIsPlayerActive(true);
    const handleUserInactive = () => setIsPlayerActive(false);
    const handleTimeUpdate = () => {
      if (isSeekingRef.current || isProgressHoldRef.current) return;
      const time = player.currentTime?.();
      if (typeof time === "number") {
        setCurrentTime(time);
        setSeekValue(time);
      }
    };
    const handleDurationChange = () => {
      const nextDuration = player.duration?.();
      if (typeof nextDuration === "number") setDuration(nextDuration);
    };
    const handleBuffered = () => {
      const nextDuration = player.duration?.();
      if (typeof nextDuration !== "number" || nextDuration <= 0) {
        setBufferedTime(0);
        return;
      }
      const ranges = player.buffered?.();
      if (!ranges || typeof ranges.length !== "number") {
        setBufferedTime(0);
        return;
      }
      let maxEnd = 0;
      for (let i = 0; i < ranges.length; i += 1) {
        const end = ranges.end(i);
        if (end > maxEnd) maxEnd = end;
      }
      setBufferedTime(Math.min(maxEnd, nextDuration));
    };
    const handleVolume = () => {
      const nextVolume = player.volume?.();
      const nextMuted = player.muted?.();
      if (typeof nextVolume === "number") setVolume(nextVolume);
      if (typeof nextMuted === "boolean") setIsMuted(nextMuted);
    };
    const handleRate = () => {
      const nextRate = player.playbackRate?.();
      if (typeof nextRate === "number") setPlaybackRate(nextRate);
    };
    const handleFullscreen = () => {
      const nextFullscreen = player.isFullscreen?.();
      if (typeof nextFullscreen === "boolean") setIsFullscreen(nextFullscreen);
    };

    player.on?.("useractive", handleUserActive);
    player.on?.("userinactive", handleUserInactive);
    player.on?.("timeupdate", handleTimeUpdate);
    player.on?.("durationchange", handleDurationChange);
    player.on?.("loadedmetadata", handleDurationChange);
    player.on?.("progress", handleBuffered);
    player.on?.("loadedmetadata", handleBuffered);
    player.on?.("durationchange", handleBuffered);
    player.on?.("volumechange", handleVolume);
    player.on?.("ratechange", handleRate);
    player.on?.("fullscreenchange", handleFullscreen);

    handleDurationChange();
    handleTimeUpdate();
    handleVolume();
    handleRate();
    handleFullscreen();
    handleBuffered();
    return () => {
      player.off?.("useractive", handleUserActive);
      player.off?.("userinactive", handleUserInactive);
      player.off?.("timeupdate", handleTimeUpdate);
      player.off?.("durationchange", handleDurationChange);
      player.off?.("loadedmetadata", handleDurationChange);
      player.off?.("progress", handleBuffered);
      player.off?.("loadedmetadata", handleBuffered);
      player.off?.("durationchange", handleBuffered);
      player.off?.("volumechange", handleVolume);
      player.off?.("ratechange", handleRate);
      player.off?.("fullscreenchange", handleFullscreen);
    };
  }, [player]);

  useEffect(() => {
    if (
      !isSpeedMenuOpen &&
      !isQualityMenuOpen &&
      !isPlayerMenuOpen &&
      !isDubberMenuOpen &&
      !isEpisodeMenuOpen
    ) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target instanceof HTMLElement && event.target.classList.contains('vjs-tech')) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log('event.stopPropagation();');
      }
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      const targetEl = targetNode as HTMLElement | null;
      const isInsideSpeed = speedMenuRef.current?.contains(targetNode);
      const isInsideQuality = qualityMenuRef.current?.contains(targetNode);
      const isInsidePlayer = playerMenuRef.current?.contains(targetNode);
      const isInsideDubber = dubberMenuRef.current?.contains(targetNode);
      const isInsideEpisode = episodeMenuRef.current?.contains(targetNode);
      if (
        !isInsideSpeed &&
        !isInsideQuality &&
        !isInsidePlayer &&
        !isInsideDubber &&
        !isInsideEpisode
      ) {
        setIsSpeedMenuOpen(false);
        setIsQualityMenuOpen(false);
        setIsPlayerMenuOpen(false);
        setIsDubberMenuOpen(false);
        setIsEpisodeMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [
    isSpeedMenuOpen,
    isQualityMenuOpen,
    isPlayerMenuOpen,
    isDubberMenuOpen,
    isEpisodeMenuOpen,
  ]);

  useEffect(() => {
    if (!sources.length) return;
    const selectedIndex = sources.findIndex((source) => source.selected);
    setQualityIndex(selectedIndex >= 0 ? selectedIndex : sources.length - 1);
  }, [sources]);

  useEffect(() => {
    const currentEpisodes =
      anime.players[videoParams.player].dubbers[videoParams.dubber].episodes;
    const maxEpisodes = currentEpisodes.length - 1;
    const currentDubbers = anime.players[videoParams.player].dubbers;
    const maxDubbers = currentDubbers.length - 1;
    const maxPlayers = anime.players.length - 1;

    const handleNextPlayer = (event: KeyboardEvent) => {
      const nextPlayer = Math.min(videoParams.player + 1, maxPlayers);
      if (nextPlayer !== videoParams.player) {
        handlePlayerChange(nextPlayer);
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handlePrevPlayer = (event: KeyboardEvent) => {
      const prevPlayer = Math.max(videoParams.player - 1, 0);
      if (prevPlayer !== videoParams.player) {
        handlePlayerChange(prevPlayer);
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleNextDubber = (event: KeyboardEvent) => {
      const nextDubber = Math.min(videoParams.dubber + 1, maxDubbers);
      if (nextDubber !== videoParams.dubber) {
        handleDubberChange(nextDubber);
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handlePrevDubber = (event: KeyboardEvent) => {
      const prevDubber = Math.max(videoParams.dubber - 1, 0);
      if (prevDubber !== videoParams.dubber) {
        handleDubberChange(prevDubber);
      }
      event.preventDefault();
      event.stopPropagation();
    };

    const handleNextEpisode = () => {
      const nextEpisode = Math.min(videoParams.episode + 1, maxEpisodes);
      if (nextEpisode !== videoParams.episode) {
        handleEpisodeChange(nextEpisode);
      }
    };

    const handlePrevEpisode = () => {
      const prevEpisode = Math.max(videoParams.episode - 1, 0);
      if (prevEpisode !== videoParams.episode) {
        handleEpisodeChange(prevEpisode);
      }
    };

    const unsubs = [
      keyStack.subscribe("Ctrl+Period", handleNextPlayer),
      keyStack.subscribe("Ctrl+Comma", handlePrevPlayer),
      keyStack.subscribe("Shift+Period", handleNextDubber),
      keyStack.subscribe("Shift+Comma", handlePrevDubber),
      keyStack.subscribe("Period", handleNextEpisode),
      keyStack.subscribe("Comma", handlePrevEpisode),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
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

  const PlayerSelectOptions = anime.players.map((playerItem, index) => ({
    value: index,
    label: playerItem.name,
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

  const QualitySelectOptions = sources.map((source, index) => ({
    value: index,
    label: source.label || `Качество ${index + 1}`,
  }));

  const handleSeekStart = () => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setIsDragging(false);
    setSeekValue(currentTime);
  };

  const handleSeekEnd = () => {
    isSeekingRef.current = false;
    setIsSeeking(false);
    setIsDragging(false);
    seekStartXRef.current = null;
    player.currentTime?.(seekValue);
    setCurrentTime(seekValue);
  };

  const handleSeekChange = (value: number) => {
    setSeekValue(value);
  };

  const handleSeekMove = (clientX: number) => {
    if (!isSeekingRef.current || isDragging) return;
    if (seekStartXRef.current === null) {
      seekStartXRef.current = clientX;
      return;
    }
    if (Math.abs(clientX - seekStartXRef.current) > 3) {
      setIsDragging(true);
    }
  };

  const handleVolumeMove = (clientX: number) => {
    if (isVolumeDragging) return;
    if (volumeStartXRef.current === null) {
      volumeStartXRef.current = clientX;
      return;
    }
    if (Math.abs(clientX - volumeStartXRef.current) > 3) {
      setIsVolumeDragging(true);
    }
  };

  const activeTime = isSeeking ? seekValue : currentTime;
  const remainingTime = Math.max(duration - activeTime, 0);

  const handleMute = () => {
    const nextMuted = !player.muted?.();
    player.muted?.(nextMuted);
  };

  const handleVolumeChange = (value: number) => {
    player.volume?.(value);
    if (value > 0 && player.muted?.()) {
      player.muted?.(false);
    }
  };

  const handleTimeDisplayToggle = useCallback(() => {
    setShowRemainingTimeSetting(!showRemainingTime);
  }, []);

  useEffect(() => {
    if (!isTimeDisplayFocused) return () => { };
    const handler = (event: KeyboardEvent) => {
      if (document.activeElement !== timeDisplayRef.current) return;
      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        handleTimeDisplayToggle();
      }
    };
    const unsubs = [
      keyStack.subscribe("Enter", handler),
      keyStack.subscribe("Space", handler),
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [isTimeDisplayFocused, handleTimeDisplayToggle]);

  const handleFullscreen = () => {
    if (!player) return;
    if (player.isFullscreen?.()) {
      player.exitFullscreen?.();
    } else {
      player.requestFullscreen?.();
    }
  };

  const handlePictureInPicture = async () => {
    const techEl = player.tech?.(true)?.el?.();
    if (!techEl || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (techEl.requestPictureInPicture) {
        await techEl.requestPictureInPicture();
      }
    } catch (error) {
      console.log("PIP error", error);
    }
  };

  const renderInlineSelect = ({
    options,
    value,
    isOpen,
    onToggle,
    onChange,
    rootRef,
  }: {
    options: { value: number; label: string }[];
    value: number;
    isOpen: boolean;
    onToggle: () => void;
    onChange: (value: number) => void;
    rootRef: React.RefObject<HTMLDivElement | null>;
  }) => (
    <div ref={rootRef} className={`inline-select ${isOpen ? "open" : ""}`}>
      <button className="inline-select-trigger" onClick={onToggle}>
        <span className="inline-select-value">
          {options.find((option) => option.value === value)?.label}
        </span>
      </button>
      <div className="inline-select-menu">
        {options.map((option) => (
          <button
            key={option.value}
            className={`inline-select-option ${option.value === value ? "active" : ""}`}
            onClick={() => {
              onChange(option.value);
              onToggle();
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );



  const controls = (
    <div
      ref={controlsRef}
      className="player-controls-root active"
      onMouseMove={() => player.userActive?.(true)}
    >
      <div className="player-controls-top">
        <StackedSelect
          options={PlayerSelectOptions}
          value={videoParams.player}
          isOpen={isPlayerMenuOpen}
          onToggle={() =>
            setIsPlayerMenuOpen((prev) => {
              if (!prev) {
                setIsDubberMenuOpen(false);
                setIsEpisodeMenuOpen(false);
                setIsSpeedMenuOpen(false);
                setIsQualityMenuOpen(false);
              }
              return !prev;
            })
          }
          onChange={handlePlayerChange}
          rootRef={playerMenuRef}
        />
        <StackedSelect
          options={DubberSelectOptions}
          value={videoParams.dubber}
          isOpen={isDubberMenuOpen}
          onToggle={() =>
            setIsDubberMenuOpen((prev) => {
              if (!prev) {
                setIsPlayerMenuOpen(false);
                setIsEpisodeMenuOpen(false);
                setIsSpeedMenuOpen(false);
                setIsQualityMenuOpen(false);
              }
              return !prev;
            })
          }
          onChange={handleDubberChange}
          rootRef={dubberMenuRef}
        />
        <StackedSelect
          options={EpisodeSelectOptions}
          value={videoParams.episode}
          isOpen={isEpisodeMenuOpen}
          onToggle={() =>
            setIsEpisodeMenuOpen((prev) => {
              if (!prev) {
                setIsPlayerMenuOpen(false);
                setIsDubberMenuOpen(false);
                setIsSpeedMenuOpen(false);
                setIsQualityMenuOpen(false);
              }
              return !prev;
            })
          }
          onChange={handleEpisodeChange}
          rootRef={episodeMenuRef}
        />
      </div>
      <div className="player-controls-bottom">
        <div
          className={`seek-bar-wrap ${isDragging ? "dragging" : ""}`}
          style={
            {
              "--progress": `${duration ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0}%`,
              "--buffered": `${duration ? (bufferedTime / duration) * 100 : 0}%`,
            } as React.CSSProperties
          }
        >
          <input
            className="seek-bar"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={isSeeking ? seekValue : currentTime}
            onChange={(event) => handleSeekChange(Number(event.target.value))}
            onMouseDown={(event) => {
              seekStartXRef.current = event.clientX;
              handleSeekStart();
            }}
            onMouseMove={(event) => handleSeekMove(event.clientX)}
            onMouseUp={handleSeekEnd}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              seekStartXRef.current = touch?.clientX ?? null;
              handleSeekStart();
            }}
            onTouchMove={(event) => {
              const touch = event.touches[0];
              if (touch) handleSeekMove(touch.clientX);
            }}
            onTouchEnd={handleSeekEnd}
          />
          <div className="seek-thumb" />
        </div>
        <div className="controls-row">
          <div
            className="time-display"
            role="button"
            tabIndex={0}
            onClick={handleTimeDisplayToggle}
            ref={timeDisplayRef}
            onFocus={() => setIsTimeDisplayFocused(true)}
            onBlur={() => setIsTimeDisplayFocused(false)}
          >
            <span>
              {showRemainingTime
                ? `-${formatTime(remainingTime)}`
                : formatTime(activeTime)}
            </span>
            <span className="time-divider">/</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className={`volume-control ${isVolumeDragging ? "dragging" : ""}`}>
            <button className="control-button" onClick={handleMute}>
              {isMuted || volume === 0 ? (
                <BsVolumeMuteFill />
              ) : volume < 0.5 ? (
                <BsVolumeDownFill />
              ) : (
                <BsVolumeUpFill />
              )}
            </button>
            <div
              className="volume-bar-wrap"
              style={
                {
                  "--volume": `${(isMuted ? 0 : volume) * 100}%`,
                } as React.CSSProperties
              }
            >
              <input
                className="volume-bar"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(event) => handleVolumeChange(Number(event.target.value))}
                onMouseDown={(event) => {
                  volumeStartXRef.current = event.clientX;
                  setIsVolumeDragging(false);
                }}
                onMouseMove={(event) => handleVolumeMove(event.clientX)}
                onMouseUp={() => {
                  setIsVolumeDragging(false);
                  volumeStartXRef.current = null;
                }}
                onMouseLeave={() => {
                  setIsVolumeDragging(false);
                  volumeStartXRef.current = null;
                }}
                onTouchStart={(event) => {
                  const touch = event.touches[0];
                  volumeStartXRef.current = touch?.clientX ?? null;
                  setIsVolumeDragging(false);
                }}
                onTouchMove={(event) => {
                  const touch = event.touches[0];
                  if (touch) handleVolumeMove(touch.clientX);
                }}
                onTouchEnd={() => {
                  setIsVolumeDragging(false);
                  volumeStartXRef.current = null;
                }}
              />
              <div className="volume-thumb" />
            </div>
          </div>
          <div className="controls-spacer" />
          <div className="inline-select-row">
            {renderInlineSelect({
              options: speedOptions,
              value: currentSpeedIndex,
              isOpen: isSpeedMenuOpen,
              onToggle: () =>
                setIsSpeedMenuOpen((prev) => {
                  if (!prev) {
                    setIsQualityMenuOpen(false);
                    setIsPlayerMenuOpen(false);
                    setIsDubberMenuOpen(false);
                    setIsEpisodeMenuOpen(false);
                  }
                  return !prev;
                }),
              onChange: handleSpeedChange,
              rootRef: speedMenuRef,
            })}
            {QualitySelectOptions.length > 1 &&
              renderInlineSelect({
                options: QualitySelectOptions,
                value: qualityIndex,
                isOpen: isQualityMenuOpen,
                onToggle: () =>
                  setIsQualityMenuOpen((prev) => {
                    if (!prev) {
                      setIsSpeedMenuOpen(false);
                      setIsPlayerMenuOpen(false);
                      setIsDubberMenuOpen(false);
                      setIsEpisodeMenuOpen(false);
                    }
                    return !prev;
                  }),
                onChange: handleQualityChange,
                rootRef: qualityMenuRef,
              })}
          </div>
          <button className="control-button" onClick={handlePictureInPicture}>
            <MdPictureInPictureAlt />
          </button>
          <button className="control-button" onClick={handleFullscreen}>
            {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
          </button>
        </div>
      </div>
    </div>
  );

  const playerEl = player.el();
  return ReactDOM.createPortal(controls, playerEl);
};

export default PlayerControls;
