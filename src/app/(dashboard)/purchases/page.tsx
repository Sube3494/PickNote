'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import Skeleton from '@/components/Skeleton';
import styles from './page.module.css';

interface Purchase {
  id: string;
  orderNo: string;
  purchaseDate: string;
  totalAmount: number;
  shippingFee: number;
  remark?: string;
  supplier: {
    name: string;
  };
  _count: {
    items: number;
  };
}

interface Supplier {
  id: string;
  name: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [supplierId, setSupplierId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
  });

  const fetchPurchases = useCallback(() => {
    // 只有在非初始加载状态下才手动设置 loading
    setLoading(l => (l ? l : true));
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      ...(supplierId ? { supplierId } : {})
    });

    fetch(`/api/purchases?${queryParams.toString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPurchases(result.data);
          setTotalPages(result.pagination.totalPages);
          const pageTotalAmount = result.data.reduce((acc: number, p: Purchase) => acc + Number(p.totalAmount), 0);
          setStats({
            totalCount: result.pagination.total,
            totalAmount: pageTotalAmount,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, supplierId]);

  useEffect(() => {
    // 延迟执行以规避 React 并发渲染模式下的 set-state-in-effect 警告
    Promise.resolve().then(() => {
      void fetchPurchases();
    });
    
    // Fetch Suppliers for filter
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(result => {
        if (result.success) setSuppliers(result.data);
      });
  }, [fetchPurchases]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>进货管理总览</h1>
          <p className={styles.subtitle}>监控全站采供流水，实时汇总业务入库数据</p>
        </div>
        <Link href="/purchases/new" className="btn btn-primary">
          录入进货单据
        </Link>
      </header>

      <div className={styles.statsSummary}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>已入库单据总排</span>
          <span className={styles.statValue}>{stats.totalCount} <small style={{fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-dim)'}}>笔记录</small></span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>当期筛选流水规模</span>
          <span className={styles.statValue}>¥ {stats.totalAmount.toLocaleString()}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>业务覆盖状态</span>
          <span className={styles.statValue} style={{color: 'var(--color-primary)'}}>全线活跃</span>
        </div>
      </div>

      <section className={styles.listSection}>
        <div className={styles.listHeader}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            进货单详尽流水
          </h2>
          
          <div className={styles.filterBar}>
            <CustomSelect
              className={styles.filterSelect}
              value={supplierId}
              onChange={(val) => {
                setSupplierId(String(val));
                setPage(1);
              }}
              options={[
                { label: '全部供应渠道 (无筛选)', value: '' },
                ...suppliers.map(s => ({ label: s.name, value: s.id }))
              ]}
              placeholder="筛选供应商"
            />
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <table className={styles.table}>
              <thead>
                <tr>
                   {['业务单号', '供应/采选来源', '明细规模', '业务发生日期', '结算总额 (含运)', '状态', '操作'].map(h => (
                     <th key={h}>{h}</th>
                   ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><Skeleton width={100} height={20} /></td>
                    <td><Skeleton width={120} height={20} /></td>
                    <td><Skeleton width={80} height={20} /></td>
                    <td><Skeleton width={100} height={20} /></td>
                    <td><Skeleton width={90} height={20} /></td>
                    <td><Skeleton width={80} height={24} borderRadius={20} /></td>
                    <td><Skeleton width={70} height={28} borderRadius={8} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : purchases.length === 0 ? (
            <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>
              <p style={{ fontWeight: 600 }}>暂无匹配的进货记录</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>请尝试调整筛选条件或录入新单据</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>业务单号</th>
                  <th>供应/采选来源</th>
                  <th>明细规模</th>
                  <th>业务发生日期</th>
                  <th>结算总额 (含运)</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id}>
                    <td><span className={styles.orderNo}>{p.orderNo}</span></td>
                    <td><span className={styles.supplierName}>{p.supplier.name}</span></td>
                    <td style={{color: 'var(--color-text-dim)'}}>{p._count.items} 货品项</td>
                    <td className={styles.date}>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td><span className={styles.amount}>¥ {(Number(p.totalAmount) + Number(p.shippingFee)).toLocaleString()}</span></td>
                    <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>✓ 已入库</span></td>
                    <td>
                      <Link href={`/purchases/${p.id}`} className={styles.viewBtn}>
                        穿透详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={styles.pageBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><polyline points="15 18 9 12 15 6"></polyline></svg>
              上一页
            </button>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-text-dim)' }}>
              Page <span style={{color: 'var(--color-primary)'}}>{page}</span> / {totalPages}
            </span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={styles.pageBtn}
            >
              下一页
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '6px'}}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
