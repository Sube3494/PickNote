'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  address?: string;
  type: string;
  remark?: string;
  createdAt: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setSuppliers(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  const getBadgeClass = (type: string) => {
    switch (type) {
      case '1688': return styles.badge1688;
      case '拼多多': return styles.badgePdd;
      case '淘宝':
      case '天猫': return styles.badgeTaobao;
      case '微信': return styles.badgeWx;
      default: return '';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>供应商管理</h1>
          <p className={styles.subtitle}>维护全链路采购渠道，确保货源稳定透明且可追溯</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/suppliers/new" className="btn btn-primary" style={{ padding: '0 1.5rem', height: '52px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '14px', fontWeight: 800 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            录入供应商
          </Link>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="搜索渠道名、联系人或采购电话..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '8rem', textAlign: 'center', color: 'var(--color-text-dim)', fontWeight: 600 }}>
          正在穿透同步供应商全线数据...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div style={{ padding: '8rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '24px', border: '1px dashed var(--color-border)' }}>
           <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-text)' }}>未匹配到该供应商信息</p>
           <p style={{ marginTop: '0.5rem', color: 'var(--color-text-dim)' }}>请尝试更换关键词搜寻</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.supplierName}>{supplier.name}</h3>
                  <span className={`${styles.typeBadge} ${getBadgeClass(supplier.type)}`}>
                    {supplier.type || '通用渠道'}
                  </span>
                </div>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span><b>对接人:</b> {supplier.contactName || '--'}</span>
                </div>
                <div className={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span><b>联系沟通:</b> {supplier.phone || '--'}</span>
                </div>
                <div className={styles.infoLine}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <b>地址/来源:</b> {supplier.address || '--'}
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link href={`/suppliers/${supplier.id}/edit`} className={styles.editBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  修改资料
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
