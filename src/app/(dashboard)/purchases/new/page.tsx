'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ToastContext';
import { CustomSelect } from '@/components/CustomSelect';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { ProductSelectorModal } from '@/components/ProductSelectorModal';
import styles from './page.module.css';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  code: string | null;
  name: string;
  price: number;
}

interface PurchaseItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const backUrl = from === 'dashboard' ? '/' : '/purchases';
  const { showToast } = useToast();
  
  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [shippingFee, setShippingFee] = useState(0);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  
  // Data State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    // Fetch Suppliers
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(result => {
        if (result.success) setSuppliers(result.data);
      });
  }, []);


  const handleAddProducts = (selectedProducts: Product[]) => {
    const newItems = selectedProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      productCode: p.code || '',
      quantity: 1,
      unitPrice: p.price || 0,
    }));
    setItems(prev => [...prev, ...newItems]);
    showToast(`成功添加 ${selectedProducts.length} 个货品`, 'success');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i));
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    return itemsTotal + shippingFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return showToast('请选择供应商', 'error');
    if (items.length === 0) return showToast('请至少添加一个货品', 'error');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          purchaseDate,
          shippingFee,
          remark,
          items,
          totalAmount: items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0),
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast('进货单保存成功', 'success');
        router.push(backUrl);
      } else {
        showToast(result.message || '保存失败', 'error');
      }
    } catch {
      showToast('提交失败，请检查网络', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={backUrl} className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          返回进货列表
        </Link>
        <h1 className={styles.title}>录入新进货单</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.mainContent}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              基础信息
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.field}>
                <label className={styles.label}>供应商 / 渠道 *</label>
                <CustomSelect
                  value={supplierId}
                  onChange={(val) => setSupplierId(String(val))}
                  options={suppliers.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="请选择供应商"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>进货日期</label>
                <CustomDatePicker
                  value={purchaseDate}
                  onChange={(val) => setPurchaseDate(val)}
                />
              </div>
            </div>
          </section>

          <section className={styles.section} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="19" y1="9" x2="5" y2="9"></line><line x1="19" y1="14" x2="5" y2="14"></line><line x1="19" y1="19" x2="5" y2="19"></line><line x1="9" y1="9" x2="9" y2="19"></line></svg>
              进货明细
            </h2>
            
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>货品名称</th>
                  <th>数量</th>
                  <th>单价 (¥)</th>
                  <th>小计 (¥)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.productName}</span>
                        <span className={styles.itemCode}>{item.productCode}</span>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        min="1"
                        className={styles.qtyInput}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        step="0.01"
                        className={styles.priceInput}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.productId, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <span className={styles.subtotal}>¥ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </td>
                    <td>
                      <button type="button" className={styles.removeBtn} onClick={() => removeItem(item.productId)}>
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.addItemBtn} onClick={() => setIsProductModalOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              添加进货货品...
            </div>
          </section>

          <section className={styles.section} style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>补充备注</h2>
            <textarea 
              className={styles.textarea}
              placeholder="记录如运单号、收货情况说明等..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
            />
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>商品小计</span>
              <span className={styles.summaryValue}>¥ {(calculateTotal() - shippingFee).toFixed(2)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>运费支出</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ¥ <input 
                  type="number"
                  className={styles.input}
                  style={{ width: '80px', height: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0 0.5rem' }}
                  min="0"
                  value={shippingFee}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setShippingFee(Math.max(0, val));
                  }}
                />
              </div>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>合计总金额</span>
              <span className={styles.totalValue}>¥ {calculateTotal().toFixed(2)}</span>
            </div>
            
            <div className={styles.actions}>
              <button 
                type="submit" 
                className={`btn ${styles.submitBtn}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? '保存中...' : '确认并创建进货单'}
              </button>
              <Link href={backUrl} className={styles.cancelBtn}>取消并返回</Link>
            </div>
          </div>
        </aside>
      </form>

      <ProductSelectorModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleAddProducts}
        excludeIds={items.map(i => i.productId)}
      />
    </div>
  );
}
