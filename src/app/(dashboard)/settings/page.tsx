'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeContext';
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
        <h1 className={styles.title}>系统设置</h1>
        <p className={styles.subtitle}>管理个人偏好及查看系统运行状态</p>
      </header>

      <div className={styles.content}>
        {/* 主题选择 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>外观展示</h2>
              <p className={styles.sectionDesc}>切换适合当前环境的视觉模式</p>
            </div>
            <div className={styles.icon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            </div>
          </div>
          
          <div className={styles.themeSelector}>
            <button 
              className={`${styles.themeBtn} ${theme === 'light' ? styles.active : ''}`}
              onClick={() => theme !== 'light' && toggleTheme()}
            >
              <div className={styles.previewLight}></div>
              <span>明亮模式</span>
            </button>
            <button 
              className={`${styles.themeBtn} ${theme === 'dark' ? styles.active : ''}`}
              onClick={() => theme !== 'dark' && toggleTheme()}
            >
              <div className={styles.previewDark}></div>
              <span>深邃模式</span>
            </button>
          </div>
        </section>

        {/* 系统信息摘要 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>运行摘要</h2>
              <p className={styles.sectionDesc}>PickNote 数字化资产统计</p>
            </div>
            <div className={styles.icon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>已登记货品</span>
              <span className={styles.statValue}>{loading ? '...' : stats?.productCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>供应商合作伙伴</span>
              <span className={styles.statValue}>{loading ? '...' : stats?.supplierCount}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>累计进货单据</span>
              <span className={styles.statValue}>{loading ? '...' : stats?.purchaseCount}</span>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>关于系统</h2>
              <p className={styles.sectionDesc}>软件版本及相关说明</p>
            </div>
          </div>
          <div className={styles.aboutContent}>
            <div className={styles.version}>
              <span className={styles.vLabel}>版本号</span>
              <span className={styles.vCode}>v1.2.0 (Stable)</span>
            </div>
            <p className={styles.legal}>
              PickNote 是专门为极简主义者设计的数字化进货管理系统，旨在最大程度降低录入成本，提升库存透明度。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
