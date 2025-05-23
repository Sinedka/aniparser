import { Anime } from "../../../api/source/Yumme_anime_ru";
import { useEffect, useRef, useState } from "react";
import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import "./player.css";

// Определение типов для VideoJS
type VideoJsPlayer = ReturnType<typeof videojs>;

// Типы для источников видео
interface VideoSource {
  src: string;
  type: string;
}

function Player({ anime }: { anime: Anime }): React.ReactElement {
  const [sources, setSources] = useState<VideoSource[]>([]);
  const videoRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<VideoJsPlayer | null>(null);

  React.useEffect(() => {
    const options = {
      autoplay: false,
      controls: true,
      responsive: true,
      fluid: false,
      fill: true,
      aspectRatio: "16:9",
      playbackRates: [0.5, 1, 1.5, 2],
      sources: sources,
    };

    console.log(sources);
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

      const player = (playerRef.current = videojs(videoElement, options, () => {
        videojs.log("player is ready");
        // Добавляем селектор озвучек после инициализации плеера
        // if (voices.length > 1) {
        //   dubberMenu(player);
        // }
      }));

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current;

      if (player) {
        player.autoplay(options.autoplay);
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
    <div className="video-container" data-vjs-player>
      <div ref={videoRef} className="video-container" />
    </div>
  );
}

export default Player;
