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
          <h1 className={styles.title}>系统工作台</h1>
          <p className={styles.subtitle}>
            资产档案库实时监控中
          </p>
        </div>
      </header>

      <div className={styles.mainGrid}>
        {/* 左侧主体：真实数据概览 */}
        <div className={styles.primaryColumn}>
          {/* 数据快照行 */}
          <div className={styles.snapshotGrid}>
            <div className={styles.snapshotItem}>
              <span className={styles.statLabel}>在库总量</span>
              <span className={styles.statValue}>{loading ? '...' : stats.totalProducts}</span>
            </div>
            <div className={styles.snapshotItem}>
              <span className={styles.statLabel}>活跃供应商</span>
              <span className={styles.statValue}>{loading ? '...' : stats.totalSuppliers}</span>
            </div>
            <div className={styles.snapshotItem}>
              <span className={styles.statLabel}>本月单据</span>
              <span className={styles.statValue}>{loading ? '...' : stats.totalPurchases}</span>
            </div>
            <div className={styles.snapshotItem}>
              <span className={styles.statLabel}>资产估值</span>
              <span className={styles.statValue}>¥{loading ? '...' : (stats.totalValue / 1000).toFixed(1)}k</span>
            </div>
          </div>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>数据概览</h2>
            </div>
            <div className={styles.emptyText}>
              暂无更多监控数据
            </div>
          </section>
        </div>

        {/* 右侧：便捷工具栏 */}
        <aside className={styles.secondaryColumn}>
          <div className={styles.toolBox}>
            <h3 className={styles.toolTitle}>快捷中心</h3>
            <div className={styles.toolGrid}>
              <Link href="/products/new" className={styles.toolBtn}>
                <div className={styles.toolIcon}>+</div>
                <span>新增货品</span>
              </Link>
              <Link href="/products/import" className={styles.toolBtn}>
                <div className={styles.toolIcon}>↑</div>
                <span>批量导入</span>
              </Link>
              <Link href="/purchases/new" className={styles.toolBtn}>
                <div className={styles.toolIcon}>🧾</div>
                <span>采购入库</span>
              </Link>
              <Link href="/settings" className={styles.toolBtn}>
                <div className={styles.toolIcon}>⚙️</div>
                <span>系统设置</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
