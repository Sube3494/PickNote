'use client';

import React from 'react';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.welcome}>
        <span>PickNote 资产档案同步中...</span>
      </div>
    </header>
  );
}
