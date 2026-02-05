'use client'

import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Product {
  id: string
  name: string
  code: string
  category: string
  currentStock: number
  images: string | null
}

interface Purchase {
  id: string
  orderNo: string
  purchaseDate: string
  totalAmount: number
  supplier: {
    name: string
  }
}

interface DashboardStats {
  totalProducts: number
  totalSuppliers: number
  totalPurchases: number
  totalValue: number
  recentProducts: Product[]
  recentPurchases: Purchase[]
}

const DashboardIcons = {
  Product: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Purchase: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  ),
  Add: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  ),
  Import: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 16 12 12 8 16"></polyline></svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  )
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalValue: 0,
    recentProducts: [],
    recentPurchases: []
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
            totalValue: result.data.totalStockValue || 0,
            recentProducts: result.data.recentProducts || [],
            recentPurchases: result.data.recentPurchases || []
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
            资产状态实时监控中
          </p>
        </div>
        <div className={styles.dateInfo}>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </header>

      <div className={styles.mainContent}>
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

        {/* 核心作业区域 - 现在横向排列 */}
        <div className={styles.toolBox}>
          <h3 className={styles.toolTitle}>核心作业</h3>
          <div className={styles.toolGrid}>
            <Link href="/products/new" className={styles.toolBtn}>
              <div className={styles.toolIcon}><DashboardIcons.Add /></div>
              <span>录入全新货品</span>
            </Link>
            <Link href="/products/import" className={styles.toolBtn}>
              <div className={styles.toolIcon}><DashboardIcons.Import /></div>
              <span>大类批量导入</span>
            </Link>
            <Link href="/purchases/new" className={styles.toolBtn}>
              <div className={styles.toolIcon}><DashboardIcons.Purchase /></div>
              <span>采购入库登记</span>
            </Link>
            <Link href="/settings" className={styles.toolBtn}>
              <div className={styles.toolIcon}><DashboardIcons.Settings /></div>
              <span>系统参数配置</span>
            </Link>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <DashboardIcons.Product />
                最近新增货品
              </h2>
              <Link href="/products" className={styles.moreBtn}>查看全部 →</Link>
            </div>
            
            {loading ? (
              <div className={styles.loadingPulse}>正在同步资产数据...</div>
            ) : stats.recentProducts.length > 0 ? (
              <div className={styles.listContainer}>
                {stats.recentProducts.map(product => {
                  let firstImage = '';
                  try {
                    if (product.images) {
                      const imagesArray = JSON.parse(product.images);
                      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                        firstImage = imagesArray[0];
                      }
                    }
                  } catch (e) {
                    console.error('解析图片失败', e);
                  }

                  return (
                    <Link href={`/products/${product.id}`} key={product.id} className={styles.listItem}>
                      <div className={styles.itemImage}>
                        {firstImage ? (
                          <Image 
                            src={firstImage} 
                            alt={product.name} 
                            width={52} 
                            height={52} 
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className={styles.placeholderImg}>
                            <DashboardIcons.Product />
                          </div>
                        )}
                      </div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{product.name}</div>
                        <div className={styles.itemMeta}>
                          <span>编码: {product.code}</span>
                          <span>分类: {product.category}</span>
                        </div>
                      </div>
                      <div className={styles.itemStock}>
                        {product.currentStock} 件
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyText}>暂无新增货品记录</div>
            )}
          </section>

          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <DashboardIcons.Purchase />
                最近采购简报
              </h2>
              <Link href="/purchases" className={styles.moreBtn}>财务台账 →</Link>
            </div>
            
            {loading ? (
              <div className={styles.loadingPulse}>读取采购流水中...</div>
            ) : stats.recentPurchases.length > 0 ? (
              <div className={styles.listContainer}>
                {stats.recentPurchases.map(purchase => (
                  <div key={purchase.id} className={styles.listItem}>
                    <div className={styles.itemImage}>
                      <DashboardIcons.Purchase />
                    </div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemName}>{purchase.supplier.name}</div>
                      <div className={styles.itemMeta}>
                        <span>单号: {purchase.orderNo}</span>
                        <span>日期: {new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={styles.itemStock} style={{ color: 'var(--color-success)' }}>
                      ¥{(purchase.totalAmount / 1).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyText}>本月尚无采购记录</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
