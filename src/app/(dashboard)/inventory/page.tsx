'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  useEffect(() => {
    fetch('/api/products?limit=1000') // Fetch all for management
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) throw new Error('Not JSON');
        return res.json();
      })
      .then(result => {
        if (result.success) {
          setProducts(result.data);
        }
      })
      .catch(err => console.error('Inventory Load Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.code.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'low') return p.currentStock > 0 && p.currentStock <= 5; // Example threshold
    if (filterType === 'out') return p.currentStock <= 0;
    return true;
  });

  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.price || 0)), 0);
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= 5).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>实时库存中枢</h1>
          <p className={styles.subtitle}>全面追踪货品存量动态及库存预警状态</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statLabel}>当前总库存 (件)</div>
          <div className={styles.statValue}>{totalStock.toLocaleString()}</div>
        </div>
        <div className={`${styles.statCard} ${styles.value}`}>
          <div className={styles.statLabel}>库存总货值 (元)</div>
          <div className={styles.statValue}>¥{totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statLabel}>需要补拥 (≤5)</div>
          <div className={styles.statValue}>
            {lowStockCount + outOfStockCount}
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-dim)', marginLeft: '0.5rem' }}>项</span>
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <button 
            className={`${styles.filterBtn} ${filterType === 'all' ? styles.active : ''}`}
            onClick={() => setFilterType('all')}
          >
            全部
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'low' ? styles.active : ''}`}
            onClick={() => setFilterType('low')}
          >
            库存紧张
          </button>
          <button 
            className={`${styles.filterBtn} ${filterType === 'out' ? styles.active : ''}`}
            onClick={() => setFilterType('out')}
          >
            已断货
          </button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {loading ? (
           <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-dim)'}}>
             数据装载中...
           </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'var(--color-bg-card)', borderRadius: '24px', border: '1px solid var(--color-border)'}}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem'}}>未找到相关库存</h3>
            <p style={{color: 'var(--color-text-dim)'}}>请尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const isOut = product.currentStock <= 0;
            const isLow = !isOut && product.currentStock <= 5;
            
            return (
              <div key={product.id} className={styles.invCard}>
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
                  <div className={`${styles.stockBadge} ${isOut ? styles.statusOut : isLow ? styles.statusLow : styles.statusNormal}`}>
                    <span className={styles.statusDot}></span>
                    {product.currentStock} {product.unit || '件'}
                  </div>

                  <Link href={`/products/${product.id}`} className={styles.viewBtn}>
                    查看
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
