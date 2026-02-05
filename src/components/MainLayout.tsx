'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import styles from './MainLayout.module.css';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <div className={styles.main}>
        <Header onMenuClick={toggleSidebar} />
        
        <main className={styles.content}>
          <div className={styles.container}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
