'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import styles from './page.module.css';

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    code: string;
    name: string;
    category: string;
    spec?: string;
  };
}

interface Purchase {
  id: string;
  orderNo: string;
  purchaseDate: string;
  totalAmount: number;
  shippingFee: number;
  remark?: string;
  supplier: {
    name: string;
    type: string;
    contactName?: string;
    phone?: string;
  };
  items: PurchaseItem[];
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/purchases/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPurchase(result.data);
        } else {
          showToast('单据不存在或已被删除', 'error');
          router.push('/purchases');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router, showToast]);

  const handleDelete = async () => {
    if (!confirm('确定要作废并删除这笔进货单吗？该操作不可撤销，且系统将自动扣减已增加的关联货品库存。')) return;

    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast('单据已删除，库存已回退', 'success');
        router.push('/purchases');
      } else {
        showToast(result.message || '删除失败', 'error');
      }
    } catch {
      showToast('网络请求失败', 'error');
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>档案资料调取中...</div>;
  if (!purchase) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.backGroup}>
          <Link href="/purchases" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回进货记录
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>进货单详情</h1>
            <span className={styles.badge}>已入库确认</span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              进货明细清单
            </h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>货品信息</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>单行小计</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.product.name}</span>
                        <span className={styles.itemCode}>{item.product.code} · {item.product.spec || '标配'}</span>
                      </div>
                    </td>
                    <td>¥ {item.unitPrice.toLocaleString()}</td>
                    <td>x {item.quantity}</td>
                    <td><span className={styles.amount}>¥ {item.subtotal.toLocaleString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {purchase.remark && (
             <section className={styles.card}>
                <h2 className={styles.cardTitle}>补充备注 / 说明</h2>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                  {purchase.remark}
                </p>
             </section>
          )}
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>单据基本信息</h2>
            <div className={styles.infoSection}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>系统单号</span>
                <span className={styles.infoValue} style={{ fontFamily: 'var(--font-mono)' }}>{purchase.orderNo}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>进货日期</span>
                <span className={styles.infoValue}>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>供货商</span>
                <span className={styles.infoValue}>{purchase.supplier.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>采购渠道</span>
                <span className={styles.infoValue}>{purchase.supplier.type}</span>
              </div>
            </div>

            <div className={styles.summary} style={{ marginTop: '2rem' }}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>商品总额</span>
                <span className={styles.summaryValue}>¥ {purchase.totalAmount.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>物流费用</span>
                <span className={styles.summaryValue}>¥ {purchase.shippingFee.toLocaleString()}</span>
              </div>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>订单合计</span>
                <span className={styles.totalValue}>¥ {(purchase.totalAmount + purchase.shippingFee).toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.dangerActions}>
               <button onClick={handleDelete} className={styles.deleteBtn}>
                 作废此进货单
               </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
