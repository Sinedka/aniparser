import { useState, ReactNode } from "react";
import "./ToggleButton.css";

interface ToggleButtonProps {
  onToggle?: (state: boolean) => void;
  onEnable?: () => void;
  onDisable?: () => void;
  enabledByDefault?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function ToggleButton({
  onToggle = () => {},
  onEnable = () => {},
  onDisable = () => {},
  enabledByDefault = false,
  className = "toggle-buttton",
  children,
}: ToggleButtonProps) {
  const [isOn, setIsOn] = useState(enabledByDefault);

  const handleClick = () => {
    const newState = !isOn;
    setIsOn(newState);
    onToggle(newState);
    if (newState) onEnable();
    else onDisable();
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} ${isOn ? "on" : "off"}`}
    >
      {children}
    </button>
  );
}

