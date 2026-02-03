'use client'

import styles from "./page.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalProducts: number
  totalSuppliers: number
  totalPurchases: number
  totalValue: number
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalValue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const result = await res.json()
        
        if (result.success) {
          setStats({
            totalProducts: result.data.productCount || 0,
            totalSuppliers: result.data.supplierCount || 0,
            totalPurchases: result.data.purchaseCount || 0,
            totalValue: result.data.totalStockValue || 0
          })
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStats()
  }, [])


  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>数据总览</h1>
          <p className={styles.subtitle}>
            实时行情更新 · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/products/new" className="btn btn-primary">快速入库</Link>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <span className={styles.statValue}>{loading ? '...' : stats.totalProducts}</span>
          <span className={styles.statLabel}>在库商品总数</span>
          <div style={{ marginTop: '1rem' }}>
            <span className={`${styles.trend} ${styles.trendUp}`}>稳定运行</span>
          </div>
        </div>
        
        <div className={stats.totalSuppliers > 0 ? `${styles.statCard}` : styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <span className={styles.statValue}>{loading ? '...' : stats.totalSuppliers}</span>
          <span className={styles.statLabel}>活跃供应商渠道</span>
          <div style={{ marginTop: '1rem' }}>
             <span className={styles.trend}>当前可用</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <span className={styles.statValue}>{loading ? '...' : stats.totalPurchases}</span>
          <span className={styles.statLabel}>本月处理单据</span>
          <div style={{ marginTop: '1rem' }}>
            <span className={styles.trend}>实时结算</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <span className={styles.statValue}>
            ¥{loading ? '...' : (stats.totalValue / 1000).toFixed(1)}k
          </span>
          <span className={styles.statLabel}>预估货值存量</span>
          <div style={{ marginTop: '1rem' }}>
            <span className={`${styles.trend} ${styles.trendUp}`}>价值稳健</span>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <section className={styles.mainSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>业务助手</h2>
            <Link href="/products" className={styles.textLink}>查看全部资源</Link>
          </div>
          <div className={styles.actionGrid}>
            <Link href="/products/import" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>
              </div>
              <div className={styles.actionContent}>
                <span className={styles.actionName}>Excel 批量智能导入</span>
                <p className={styles.actionDesc}>基于视觉识别技术解析表格中的商品图片并自动映射关联。</p>
              </div>
            </Link>
            <Link href="/purchases/new" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              </div>
              <div className={styles.actionContent}>
                <span className={styles.actionName}>单次进货单极速录入</span>
                <p className={styles.actionDesc}>快速记录零散采购明细，支持同步上传纸质面单凭证文件。</p>
              </div>
            </Link>
            <Link href="/products" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <div className={styles.actionContent}>
                <span className={styles.actionName}>实时库存态势感知</span>
                <p className={styles.actionDesc}>对在库、缺货、冗余货品进行层级分析，有效辅助经营决策。</p>
              </div>
            </Link>
          </div>
        </section>

        <section className={styles.sideSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>系统动态</h2>
          </div>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={styles.activityDotWrapper}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityLine}></div>
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><b>入库：</b> 玩具系列货品导入成功</p>
                <span className={styles.activityTime}>5 分钟前</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityDotWrapper}>
                <div className={styles.activityDot} style={{ background: 'var(--color-warning)' }}></div>
                <div className={styles.activityLine}></div>
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><b>预警：</b> 燕窝礼盒库存量触底</p>
                <span className={styles.activityTime}>2 小时前</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityDotWrapper}>
                <div className={styles.activityDot} style={{ background: 'var(--color-accent)' }}></div>
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}><b>更新：</b> 供应商渠道信息已同步</p>
                <span className={styles.activityTime}>昨日 14:20</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
