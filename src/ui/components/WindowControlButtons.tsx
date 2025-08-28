import { FaRegSquare, FaPlus, FaMinus, FaRegWindowRestore } from "react-icons/fa";
import "./WindowControlButtons.css"
import { useEffect, useState } from "react";

export default function WindowControllButtons() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Первичная проверка
    setIsFullscreen(!window.electronAPI.isFullscreen());

    // Подписка на внешние изменения fullscreen
    window.electronAPI.onFullscreenChanged((state) => {
      setIsFullscreen(state);
    });
  }, []);

  return (
    <div className="window-controll-buttons">
      <button className="close-window" onClick={() => window.electronAPI.closeApp()}>
        <FaPlus />
      </button>
      <button className="fullscreen-window" onClick={() => window.electronAPI.toggleFullScreen()}>
        {isFullscreen ? <FaRegWindowRestore /> : <FaRegSquare />}
      </button>

      <button className="hide-window" onClick={() => window.electronAPI.minimizeApp()}>
        <FaMinus />
      </button>
    </div>
  )

}
