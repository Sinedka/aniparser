import React, { useState, useRef, useEffect, useCallback } from "react";
import "./CustomSelect.css";

interface Option {
  value: number;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: number;
  onChange: (value: number) => void;
  className?: string;
  onActiveChange?: (isActive: boolean) => void;
  needOverlay?: boolean;
}

const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  (
    {
      options,
      value,
      onChange,
      className = "",
      onActiveChange,
      needOverlay = true,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHover, setIsHover] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const selectedOption = options.find((option) => option.value == value);

    const closeSelect = () => {
      setIsOpen(false);
    };

    const toggleDropdown = () => {
      setIsOpen(!isOpen);
    };

    const handleOptionClick = (optionValue: number) => {
      onChange(optionValue);
      setIsHover(false);
      closeSelect();
    };

    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHover(true);
    };

    const handleMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHover(false);
      }, 1000);
    };

    useEffect(() => {
      onActiveChange?.(isOpen || isHover);
    }, [isOpen, isHover]);

    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      };
    }, []);

    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        e.preventDefault();   // отменяет стандартное действие (например, фокус или выделение)
        e.stopPropagation();  // останавливает всплытие события
        console.log("Нажатие заблокировано!");
        if (!e.target) return
        if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
      if (isOpen) document.addEventListener("mousedown", handleClickOutside, true);
      else document.removeEventListener("mousedown", handleClickOutside, true);


      return () => document.removeEventListener("mousedown", handleClickOutside, true);
    }, [isOpen]);

    return (
      <div
        className={`custom-select ${className} ${isOpen ? "open" : ""}`}
        ref={ref || selectRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="select-selected" onClick={toggleDropdown}>
          <span>{selectedOption?.label || "Выберите опцию"}</span>
          <span className={`arrow ${isOpen ? "up" : "down"}`}></span>
        </div>
        {isOpen && (
          <div className="select-options">
            {options.map((option) => (
              <div
                key={option.value}
                className={`select-option ${option.value === value ? "selected" : ""
                  }`}
                onClick={() => handleOptionClick(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default CustomSelect;
