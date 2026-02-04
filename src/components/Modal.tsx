'use client';

import React, { useState, useEffect } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  showInput?: boolean;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function Modal({
  isOpen,
  title,
  message,
  defaultValue = '',
  placeholder = '',
  showInput = false,
  children,
  confirmText = '确定',
  cancelText = '取消',
  type = 'default',
  onConfirm,
  onClose,
}: ModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);


  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>
        
        <div className={styles.body}>
          {message && <p className={styles.message}>{message}</p>}
          {showInput && (
            <input 
              autoFocus
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder={placeholder}
            />
          )}
          {children}
        </div>

        <footer className={styles.footer}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`${styles.btn} ${type === 'danger' ? styles.btnDanger : styles.btnConfirm}`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
}
