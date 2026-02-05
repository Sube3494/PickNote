'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './CustomDatePicker.module.css';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  className = '',
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when value changes from outside
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const years = viewDate.getFullYear();
  const months = viewDate.getMonth();

  const daysInMonth = new Date(years, months + 1, 0).getDate();
  const firstDayOfMonth = new Date(years, months, 1).getDay(); // 0 is Sunday

  // Convert Sunday (0) to 6 for Monday-start if needed, or keep 0-6
  // We'll use 0 as Sunday as per standard
  
  const handleDaySelect = (day: number) => {
    const selectedDate = new Date(years, months, day);
    // Format to YYYY-MM-DD local time
    const formatted = selectedDate.toISOString().split('T')[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(years, months + delta, 1);
    setViewDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === years && 
           today.getMonth() === months && 
           today.getDate() === day;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getFullYear() === years && 
           d.getMonth() === months && 
           d.getDate() === day;
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? styles.placeholder : ''}>
          {value ? value.replace(/-/g, '/') : placeholder}
        </span>
        <div className={styles.icon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
      </div>

      <div className={`${styles.popover} ${isOpen ? styles.popoverOpen : ''}`}>
        <div className={styles.calendarHeader}>
          <button type="button" className={styles.navBtn} onClick={() => changeMonth(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className={styles.currentMonth}>
            {years}年 {months + 1}月
          </div>
          <button type="button" className={styles.navBtn} onClick={() => changeMonth(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {weekDays.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.empty} />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            return (
              <div 
                key={day} 
                className={`${styles.day} ${isToday(day) ? styles.today : ''} ${isSelected(day) ? styles.selectedDay : ''}`}
                onClick={() => handleDaySelect(day)}
              >
                {day}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button 
            type="button" 
            className={styles.footerBtn} 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              onChange(today);
              setIsOpen(false);
            }}
          >
            今天
          </button>
          <button 
            type="button" 
            className={styles.footerBtn} 
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            清除
          </button>
        </div>
      </div>
    </div>
  );
}
