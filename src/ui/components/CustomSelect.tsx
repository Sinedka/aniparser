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
  closeOnRefs?: React.RefObject<HTMLDivElement | null>[];
}

const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  (
    {
      options,
      value,
      onChange,
      className = "",
      onActiveChange,
      closeOnRefs = [],
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

    const handleClick = useCallback(
      (event: MouseEvent) => {
        const target = event.target as Node;

        // Проверяем, был ли клик по одному из переданных элементов
        const clickedOnCloseElement = closeOnRefs.some(
          (ref) =>
            ref.current &&
            ref.current.contains(target) &&
            ref.current !== selectRef.current,
        );

        if (clickedOnCloseElement) closeSelect();
      }, [closeOnRefs]
    )

    // Обработка кликов для закрытия селекта
    useEffect(() => {
      const handleClick = (event: MouseEvent) => {
        const target = event.target as Node;

        // Проверяем, был ли клик по одному из переданных элементов
        const clickedOnCloseElement = closeOnRefs.some(
          (ref) =>
            ref.current &&
            ref.current.contains(target) &&
            ref.current !== selectRef.current,
        );

        if (clickedOnCloseElement) closeSelect();
      };

      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          event.stopPropagation();
          event.preventDefault();
          closeSelect();
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEscKey);
      }

      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("keydown", handleEscKey);
      };
    }, [isOpen, closeOnRefs]);


    useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
        if(!e.target) return
        if (selectRef.current && !selectRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      }

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside, true);
      } else {
        document.removeEventListener("mousedown", handleClickOutside, true);
      }

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
