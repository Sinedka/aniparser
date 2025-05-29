import "./ActionIcon.css";
import {
  BsFillPlayFill,
  BsFillPauseFill,
  BsVolumeUpFill,
  BsVolumeDownFill,
  BsVolumeMuteFill,
} from "react-icons/bs";
import { MdForward5, MdReplay5 } from "react-icons/md";
import { MdOutlineSpeed, MdFullscreen, MdFullscreenExit } from "react-icons/md";
import ReactDOM from "react-dom";

// Типы действий
export type ActionType =
  | "play"
  | "pause"
  | "forward"
  | "backward"
  | "volumeUp"
  | "volumeDown"
  | "mute"
  | "unmute"
  | "speedUp"
  | "speedDown"
  | "fullscreen"
  | "exitFullscreen";

interface ActionIconProps {
  action: ActionType;
  timestamp?: number;
  volume?: number;
  player: any; // Замените any на тип вашего плеера, если он известен
}

const ActionIcon: React.FC<ActionIconProps> = ({
  action,
  timestamp,
  volume,
  player,
}) => {
  const getVolumeIcon = () => {
    const volumePercent = Math.round(volume! * 100);
    return (
      <div className="volume-icon">
        {action === "mute" ? (
          <BsVolumeMuteFill />
        ) : action === "volumeDown" ? (
          <BsVolumeDownFill />
        ) : (
          <BsVolumeUpFill />
        )}
        <span className="volume-text">{volumePercent}%</span>
      </div>
    );
  };

  const getIcon = () => {
    switch (action) {
      case "play":
        return <BsFillPlayFill />;
      case "pause":
        return <BsFillPauseFill />;
      case "forward":
        return <MdForward5 />;
      case "backward":
        return <MdReplay5 />;
      case "volumeUp":
      case "volumeDown":
      case "mute":
      case "unmute":
        return volume !== undefined ? getVolumeIcon() : <BsVolumeUpFill />;
      case "speedUp":
        return (
          <div className="speed-icon">
            <MdOutlineSpeed />
            <span className="speed-text">+</span>
          </div>
        );
      case "speedDown":
        return (
          <div className="speed-icon">
            <MdOutlineSpeed />
            <span className="speed-text">-</span>
          </div>
        );
      case "fullscreen":
        return <MdFullscreen />;
      case "exitFullscreen":
        return <MdFullscreenExit />;
      default:
        return null;
    }
  };

  const icon = (
    <div key={timestamp} className="action-icon">
      {getIcon()}
    </div>
  );

  // Получаем элемент плеера
  const playerEl = player.el();

  // Рендерим кнопку внутри плеера для корректной работы в полноэкранном режиме
  return ReactDOM.createPortal(icon, playerEl);
};

export default ActionIcon;
