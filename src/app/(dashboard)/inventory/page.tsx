'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Skeleton from '@/components/Skeleton';
import styles from './page.module.css';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  spec?: string;
  minOrderQty: number;
  unit?: string;
  images: string[];
  price?: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalStock: 0, totalValue: 0, lowStock: 0, outStock: 0 });

  // Fetch Data (Server-side Pagination & Filtering)
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Construct Query
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20', // User requested 20 per page
    });
    
    if (searchQuery) params.append('search', searchQuery);
    if (filterType !== 'all') params.append('status', filterType);

    try {
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      
      if (result.success) {
        setProducts(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
        if (result.stats) setStats(result.stats);
      }
    } catch (err) {
      console.error('Inventory Load Error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side calculations for TOP stats only (Optional: fetch these separately if accuracy needed for whole dataset)
  // For now, we might accept that stats cards show ONLY what's on the current page OR we need a separate stats API call.
  // Actually, let's keep the stats static or fetch a simple summary separately if needed. 
  // For optimization, let's remove the heavy reduce on "products" (which is now just 24 items).
  // If user wants global stats, we should hit /api/stats (already exists?).
  // For this task, I will remove the client-side heavy recalculation on 'products' to avoid confusion since 'products' is partial.
  // We can fetch a quick dashboard summary if required, but for performance let's use the totalCount from API for "Total Items".
  // Note: Previous stats relied on fetching ALL items. Let's simplify stats or mock them for now to save performance, 
  // or just show "Current Page" stats, OR (Premium) fetch /api/stats separately.
  // Let's go with: Total Count from API pagination. Values -> N/A or separate call.
  // To keep it simple and fast:
  



  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>库存管理</h1>
          <p className={styles.subtitle}>全面追踪货品存量动态及库存预警状态</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>符合条件货品</div>
            <div className={styles.statValue}>{totalCount.toLocaleString()}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>总库存货值</div>
            <div className={styles.statValue}>
               ¥{stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>库存预警</div>
            <div className={styles.statValue}>
              {stats.lowStock + stats.outStock}
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-dim)', marginLeft: '0.25rem' }}>项异常</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="搜索货品编号或名称..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => { 
              setSearchQuery(e.target.value);
              setPage(1); 
            }}
          />
        </div>
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => { setFilterType('all'); setPage(1); }}
          >
            全部
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'low' ? styles.active : ''}`}
            onClick={() => { setFilterType('low'); setPage(1); }}
          >
            库存紧张
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'out' ? styles.active : ''}`}
            onClick={() => { setFilterType('out'); setPage(1); }}
          >
            已断货
          </button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {loading ? (
          <div className={styles.cardGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.invCard} style={{ pointerEvents: 'none' }}>
                <div className={styles.invImgWrapper}>
                  <Skeleton width="100%" height="100%" borderRadius="24px 24px 0 0" />
                </div>
                <div className={styles.cardHeader}>
                  <Skeleton width="40%" height={20} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={24} />
                </div>
                <div className={styles.cardFooter}>
                  <Skeleton width="60px" height={24} borderRadius={100} />
                  <Skeleton width="80px" height={24} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'var(--color-bg-card)', borderRadius: '24px', border: '1px solid var(--color-border)'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem'}}>未找到相关库存</h3>
            <p style={{color: 'var(--color-text-dim)'}}>请尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          products.map(product => {
            const isOut = product.currentStock <= 0;
            const isLow = !isOut && product.currentStock <= 5;
            
            return (
                <Link href={`/products/${product.id}`} key={product.id} className={styles.invCard}>
                <div className={styles.invImgWrapper}>
                  {product.images && product.images.length > 0 ? (
                    <Image 
                      src={product.images[0]} 
                      alt={product.name} 
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className={styles.invImg}
                    />
                  ) : (
                     <div className={styles.invNoImg}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                     </div>
                  )}
                </div>

                <div className={styles.cardHeader}>
                  <div className={styles.productMeta}>
                    <span className={styles.pCode}>{product.code}</span>
                    <h3 className={styles.pName} title={product.name}>{product.name}</h3>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerInfo}>
                     {/* Combine Stock + Spec/Unit */}
                     <div className={`${styles.stockBadge} ${isOut ? styles.statusOut : isLow ? styles.statusLow : styles.statusNormal}`}>
                       <span className={styles.statusDot}></span>
                       {product.currentStock} {product.spec || product.unit || '件'}
                     </div>
                  </div>
                  
                  {product.price !== undefined && (
                    <div className={styles.priceTag}>
                       <span className={styles.currency}>¥</span>
                       {(product.price * product.currentStock).toFixed(2)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingTop: '2rem' }}>
          <div className={styles.pager} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--color-bg-card)', padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'var(--color-bg-alt)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              第 <span style={{ color: 'var(--color-primary)' }}>{page}</span> / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '0.5rem', borderRadius: '50%', border: 'none', background: 'var(--color-bg-alt)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
