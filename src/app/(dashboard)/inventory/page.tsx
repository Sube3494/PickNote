'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  currentStock: number;
  spec?: string;
  minOrderQty: number;
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
          <div className={styles.statLabel}>总库存货值项</div>
          <div className={styles.statValue}>{products.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statLabel}>库存紧张 (≤5)</div>
          <div className={styles.statValue}>
            {products.filter(p => p.currentStock > 0 && p.currentStock <= 5).length}
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <div className={styles.statLabel}>已断货</div>
          <div className={styles.statValue}>
            {products.filter(p => p.currentStock <= 0).length}
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

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>货品资料</th>
              <th>所属分类</th>
              <th>当前库存 (件)</th>
              <th>库存状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>数据装载中...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>未找到匹配库位</td></tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className={styles.productInfo}>
                      <span className={styles.pName}>{product.name}</span>
                      <span className={styles.pCode}>{product.code}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <span className={styles.stockCount}>{product.currentStock}</span>
                  </td>
                  <td>
                    {product.currentStock <= 0 ? (
                      <span className={`${styles.statusBadge} ${styles.outOfStock}`}>告急 / 断货</span>
                    ) : product.currentStock <= 5 ? (
                      <span className={`${styles.statusBadge} ${styles.lowStock}`}>低水位预警</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.normalStock}`}>量能充沛</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/products/${product.id}`} className={styles.viewBtn}>
                      明细追溯
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
