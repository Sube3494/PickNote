'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

export interface Option {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface CustomSelectProps {
  value: string | number | null;
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'ghost';
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
  footer,
  variant = 'default',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}
      ref={containerRef}
    >
      <div
        className={`${styles.trigger} ${variant === 'ghost' ? styles.triggerGhost : ''} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={toggleOpen}
      >
        <span className={`${!selectedOption ? styles.placeholder : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={styles.arrow} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <div className={`${styles.options} ${isOpen ? styles.optionsOpen : ''}`}>
        {options.length > 0 ? (
          options.map((option) => (
            <div
              key={option.value}
              className={`${styles.option} ${
                option.value === value ? styles.selected : ''
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <div>
                <div className={styles.optionLabel}>{option.label}</div>
                {option.subtitle && (
                  <div className={styles.optionSubtitle}>{option.subtitle}</div>
                )}
              </div>
              {option.value === value && (
                <span className={styles.check}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </div>
          ))
        ) : (
          <div className={styles.noOptions}>暂无匹配选项</div>
        )}
        
        {footer && (
          <>
            <div className={styles.divider}></div>
            <div className={styles.footer} onClick={() => setIsOpen(false)}>
              {footer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
