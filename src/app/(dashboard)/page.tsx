'use client'

import styles from "./page.module.css";
import Link from "next/link";
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

      <div className={styles.mainGrid}>
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

          <div className={styles.contentGrid}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>最近新增货品</h2>
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
                            <img src={firstImage} alt={product.name} />
                          ) : (
                            '📦'
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
                <h2 className={styles.sectionTitle}>最近采购简报</h2>
                <Link href="/purchases" className={styles.moreBtn}>财务台账 →</Link>
              </div>
              
              {loading ? (
                <div className={styles.loadingPulse}>读取采购流水中...</div>
              ) : stats.recentPurchases.length > 0 ? (
                <div className={styles.listContainer}>
                  {stats.recentPurchases.map(purchase => (
                    <div key={purchase.id} className={styles.listItem}>
                      <div className={styles.itemImage}>🧾</div>
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

        <aside className={styles.secondaryColumn}>
          <div className={styles.toolBox}>
            <h3 className={styles.toolTitle}>核心作业</h3>
            <div className={styles.toolGrid}>
              <Link href="/products/new" className={styles.toolBtn}>
                <div className={styles.toolIcon}><span>+</span></div>
                <span>录入全新货品</span>
              </Link>
              <Link href="/products/import" className={styles.toolBtn}>
                <div className={styles.toolIcon}><span>↑</span></div>
                <span>大类批量导入</span>
              </Link>
              <Link href="/purchases/new" className={styles.toolBtn}>
                <div className={styles.toolIcon}><span>🧾</span></div>
                <span>采购入库登记</span>
              </Link>
              <Link href="/settings" className={styles.toolBtn}>
                <div className={styles.toolIcon}><span>⚙️</span></div>
                <span>系统参数配置</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
