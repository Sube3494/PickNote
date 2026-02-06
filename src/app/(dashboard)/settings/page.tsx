'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeContext';
import Skeleton from '@/components/Skeleton';
import styles from './page.module.css';


interface SystemStats {
  productCount: number;
  supplierCount: number;
  purchaseCount: number;
  totalStockValue: number;
}

interface SystemStats {
  productCount: number;
  supplierCount: number;
  purchaseCount: number;
  totalStockValue: number;
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stats');
        const result = await res.json();
        
        if (result.success) {
          setStats({
            productCount: result.data.productCount || 0,
            supplierCount: result.data.supplierCount || 0,
            purchaseCount: result.data.purchaseCount || 0,
            totalStockValue: result.data.totalStockValue || 0
          });
        }
      } catch (error) {
        console.error('Settings Page Load Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>系统偏好设置</h1>
        <p className={styles.subtitle}>定制您的专属 PickNote 数字工作空间</p>
      </header>

      <div className={styles.content}>
        {/* 主题选择 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>视觉外观</h2>
              <p className={styles.sectionDesc}>切换昼夜模式，调整适合当下的视觉氛围</p>
            </div>
            <div className={styles.icon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </div>
          </div>
          
          <div className={styles.themeSelector}>
            <button 
              className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              <div className={styles.previewLight}></div>
              <span>明亮模式 (Crystal)</span>
            </button>
            <button 
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              <div className={styles.previewDark}></div>
              <span>深邃模式 (Obsidian)</span>
            </button>
          </div>
        </section>

        {/* 系统信息摘要 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>运行摘要</h2>
              <p className={styles.sectionDesc}>实时监控 PickNote 数字化核心资产状态</p>
            </div>
            <div className={styles.icon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
          </div>

          <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  <span className={styles.statLabel}>已登记货品</span>
                </div>
                <span className={styles.statValue}>{loading ? <Skeleton width={60} height={32} borderRadius={12} /> : stats?.productCount}</span>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <span className={styles.statLabel}>供应商伙伴</span>
                </div>
                <span className={styles.statValue}>{loading ? <Skeleton width={60} height={32} borderRadius={12} /> : stats?.supplierCount}</span>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statHeader}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span className={styles.statLabel}>累计进货单</span>
                </div>
                <span className={styles.statValue}>{loading ? <Skeleton width={60} height={32} borderRadius={12} /> : stats?.purchaseCount}</span>
              </div>
          </div>
        </section>

        {/* 关于 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>关于 PickNote</h2>
              <p className={styles.sectionDesc}>匠心打造的极简数字化资产管理终端</p>
            </div>
            <div className={styles.icon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
          </div>
          <div className={styles.aboutContent}>
            <div className={styles.version}>
              <span className={styles.vLabel}>当前稳定版本</span>
              <span className={styles.vCode}>v1.2.5 Stable Alpha</span>
            </div>
            <p className={styles.legal}>
              PickNote 致力于为中小型贸易者提供最极致、最流畅的本地化库存管理体验。我们崇尚 K.I.S.S 原则（Keep It Simple, Stupid），通过直观的视觉反馈和极少的输入成本，让您的数字化资产了然于胸。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
