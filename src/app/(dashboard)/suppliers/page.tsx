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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>供应商信息管理</h1>
          <p className={styles.subtitle}>维护采购渠道及其联系方式，确保供应链路稳定透明</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/suppliers/new" className="btn btn-primary" style={{borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700}}>
            录入核心供应商
          </Link>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="全站搜寻：供应商名、关键联系人或渠道电话..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--color-text-dim)', fontWeight: 600 }}>
          正在穿透同步供应商全线数据...
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--color-text-dim)' }}>
           <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>未匹配到该供应商信息</p>
           <p style={{ marginTop: '0.5rem' }}>请尝试更换关键词搜寻</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.supplierName}>{supplier.name}</h3>
                  <span className={styles.typeBadge}>{supplier.type || '通用渠道'}</span>
                </div>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.infoLine}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span><b>渠道对接:</b> {supplier.contactName || '--'}</span>
                </div>
                <div className={styles.infoLine}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <span><b>联系沟通:</b> {supplier.phone || '--'}</span>
                </div>
                <div className={styles.infoLine}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span><b>来源详情:</b> {supplier.address || '--'}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <Link href={`/suppliers/${supplier.id}/edit`} className={styles.editBtn}>
                  修改供应商信息
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
