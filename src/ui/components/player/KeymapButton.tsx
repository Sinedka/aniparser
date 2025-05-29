import React, { useState, useEffect } from "react";
import "./KeymapButton.css";
import videojs from "video.js";
import ReactDOM from "react-dom";

interface KeymapButtonProps {
  player: ReturnType<typeof videojs>;
}

const KeymapButton: React.FC<KeymapButtonProps> = ({ player }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(true);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [buttonTimeout, setButtonTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    if (!player) return;

    const handleUserActive = () => setIsPlayerActive(true);
    const handleUserInactive = () => setIsPlayerActive(false);

    player.on("useractive", handleUserActive);
    player.on("userinactive", handleUserInactive);

    return () => {
      player.off("useractive", handleUserActive);
      player.off("userinactive", handleUserInactive);
    };
  }, [player]);

  const keymaps = [
    { key: "Space / K", description: "Воспроизведение/Пауза" },
    { key: "L / →", description: "Перемотка вперед на 5 секунд" },
    { key: "J / ←", description: "Перемотка назад на 5 секунд" },
    { key: ".", description: "Следующий эпизод" },
    { key: ",", description: "Предыдущий эпизод" },
    { key: "Shift + .", description: "Следующий даббер" },
    { key: "Shift + ,", description: "Предыдущий даббер" },
    { key: "Ctrl + .", description: "Следующий плеер" },
    { key: "Ctrl + ,", description: "Предыдущий плеер" },
    { key: "F", description: "Полноэкранный режим" },
    { key: "M", description: "Отключить/включить звук" },
    { key: "↑", description: "Увеличить громкость" },
    { key: "↓", description: "Уменьшить громкость" },
    { key: "[", description: "Уменьшить скорость" },
    { key: "]", description: "Увеличить скорость" },
  ];

  const KeyButton = (
    <div
      className={`keymap-button-container ${
        isPlayerActive || isButtonActive ? "active" : ""
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (buttonTimeout) {
          clearTimeout(buttonTimeout);
        }
        setButtonTimeout(
          setTimeout(() => {
            setIsButtonActive(true);
          }, 1000),
        );
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (buttonTimeout) {
          clearTimeout(buttonTimeout);
        }
        setTimeout(() => {
          setIsButtonActive(false);
        }, 1000);
      }}
    >
      <button className="keymap-button">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 5H4C2.89543 5 2 5.89543 2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7C22 5.89543 21.1046 5 20 5Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M7 10H7.01M11 10H11.01M15 10H15.01M19 10H19.01M5 14H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {isHovered && (
        <div className="keymap-list">
          <h3>Горячие клавиши</h3>
          <ul>
            {keymaps.map((keymap, index) => (
              <li key={index}>
                <span className="key">{keymap.key}</span>
                <span className="description">{keymap.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  return ReactDOM.createPortal(KeyButton, player.el());
};

export default KeymapButton;
