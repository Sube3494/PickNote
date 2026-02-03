'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface SummaryData {
  purchaseCount: number;
  totalSpent: number;
  productCount: number;
  supplierCount: number;
}

interface TrendData {
  month: string;
  amount: number;
}

interface DistributionData {
  name: string;
  amount: number;
}

interface ProductStat {
  id: string;
  code: string;
  name: string;
  totalQuantity: number;
  totalAmount: number;
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [distribution, setDistribution] = useState<DistributionData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);

  useEffect(() => {
    // Fetch Main Stats
    const fetchMainStats = fetch('/api/stats')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setSummary(result.data.summary);
          setTrends(result.data.trends || []);
          setDistribution(result.data.supplierDistribution || []);
        }
      });

    // Fetch Top Products
    const fetchTopProducts = fetch('/api/stats/products?sortBy=amount&limit=6')
      .then(res => res.json())
      .then(result => {
        if (result.success) setTopProducts(result.data || []);
      });

    Promise.all([fetchMainStats, fetchTopProducts])
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.open('/api/purchases/export', '_blank');
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>深度分析数据加载中...</div>;

  const safeTrends = trends || [];
  const maxTrend = Math.max(...safeTrends.map(t => t.amount), 1);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>深度分析与业务洞察</h1>
          <p className={styles.subtitle} style={{fontSize: '0.9375rem', color: 'var(--color-text-dim)', fontWeight: 500, marginTop: '0.5rem'}}>
            穿透底层数据脉络，实时监控全站采供波动与库容量能
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-primary" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          导出明细报表 (.xlsx)
        </button>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>进货总累计 (CNY)</span>
          <span className={styles.statValue}>¥ {summary?.totalSpent?.toLocaleString() || '0'}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>业务单据规模</span>
          <span className={styles.statValue}>{summary?.purchaseCount || 0} <small style={{fontSize: '0.875rem', color: 'var(--color-text-dim)', fontWeight: 500}}>笔流水</small></span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>资产归档总数</span>
          <span className={styles.statValue}>{summary?.productCount || 0} <small style={{fontSize: '0.875rem', color: 'var(--color-text-dim)', fontWeight: 500}}>种货品</small></span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>供应渠道链路</span>
          <span className={styles.statValue}>{summary?.supplierCount || 0} <small style={{fontSize: '0.875rem', color: 'var(--color-text-dim)', fontWeight: 500}}>个节点</small></span>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <section className={styles.chartCard}>
          <h2 className={styles.cardTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
            月度资金流出趋势分析
          </h2>
          <div className={styles.chartPlaceholder}>
            {safeTrends.map(t => (
              <div key={t.month} className={styles.barContainer}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.625rem', color: 'var(--color-primary)' }}>
                  ¥{Math.round(t.amount / 1000)}k
                </div>
                <div 
                  className={styles.bar} 
                  style={{ height: `${(t.amount / maxTrend) * 180}px` }}
                ></div>
                <span className={styles.barLabel}>{t.month.split('-')[1]}月流水</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className={styles.cardTitle}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
             供应商支出结构均衡度
          </h2>
          <div className={styles.rankingList}>
            {distribution.map(d => (
              <div key={d.name} className={styles.rankingItem}>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>{d.name}</span>
                  <div style={{ width: '140px', height: '6px', background: 'var(--color-bg-alt)', borderRadius: '10px', marginTop: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(d.amount / (summary?.totalSpent || 1)) * 100}%`, 
                      height: '100%', 
                      background: 'var(--grad-primary)', 
                      borderRadius: '10px' 
                    }}></div>
                  </div>
                </div>
                <span className={styles.rankValue}>¥ {d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.chartCard}>
        <h2 className={styles.cardTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          货品采购热度与金额排行 (TOP 6)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {topProducts.map((p, idx) => (
             <div key={p.id} className={styles.rankingItem} style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-card)' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: idx < 3 ? 'var(--color-primary)' : 'var(--color-border)', width: '32px', textAlign: 'center', opacity: idx < 3 ? 1 : 0.5 }}>
                    0{idx + 1}
                  </span>
                  <div className={styles.rankInfo}>
                    <span className={styles.rankName} style={{fontSize: '1rem'}}>{p.name}</span>
                    <span className={styles.rankMeta} style={{fontWeight: 600}}>{p.code} · 已采 {p.totalQuantity} 件</span>
                  </div>
                </div>
                <span className={styles.rankValue} style={{color: 'var(--color-primary)'}}>¥ {p.totalAmount.toLocaleString()}</span>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
