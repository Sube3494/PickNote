'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <main className={styles.content}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
