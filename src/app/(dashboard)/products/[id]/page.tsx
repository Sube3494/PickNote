'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Skeleton from '@/components/Skeleton';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryId?: string | null;
  spec?: string;
  remark?: string;
  images: string[];
  currentStock: number;
  channel?: string;
  minOrderQty: number;
  price: number;
  createdAt: string;
  purchaseItems: Array<{
     id: string;
     quantity: number;
     unitPrice: number;
     createdAt: string;
     purchase: {
       orderNo: string;
       purchaseDate: string;
       supplier: { name: string };
     }
  }>;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          // 解析 images JSON 字符串
          let images = [];
          try {
            if (typeof result.data.images === 'string') {
              images = JSON.parse(result.data.images);
            } else if (Array.isArray(result.data.images)) {
              images = result.data.images;
            }
          } catch (e) {
            console.error('Failed to parse images:', e);
            images = [];
          }
          
          setProduct({
            ...result.data,
            images
          });
        } else {
          showToast(result.message || '加载失败', 'error');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleEdit = () => {
    router.push(`/products/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('货品信息已成功删除', 'success');
        router.push('/products');
      } else {
        showToast(data.message || '删除失败', 'error');
      }
    } catch {
      showToast('删除失败，请检查网络', 'error');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
         <div className={styles.header}>
            <Skeleton width={100} height={24} />
            <div className={styles.iconActions}>
               <Skeleton width={40} height={40} borderRadius="50%" />
               <Skeleton width={40} height={40} borderRadius="50%" />
            </div>
         </div>
         <main className={styles.container}>
            <aside className={styles.imageSection}>
               <Skeleton width="100%" height={500} borderRadius={24} />
            </aside>
            <article className={styles.detailsSection}>
               <div className={styles.heroContent}>
                  <div className={styles.heroLabels} style={{display: 'flex', gap: 10, marginBottom: 10}}>
                     <Skeleton width={80} height={24} borderRadius={100} />
                     <Skeleton width={100} height={24} borderRadius={100} />
                  </div>
                  <Skeleton width="70%" height={48} style={{ marginBottom: 20 }} />
               </div>
               <div className={styles.assetSection} style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
                  {Array.from({ length: 4 }).map((_, i) => (
                     <Skeleton key={i} width="100%" height={100} borderRadius={16} />
                  ))}
               </div>
                <div style={{ marginTop: 24 }}>
                   <Skeleton width="30%" height={24} style={{ marginBottom: 12 }} />
                   <Skeleton width="100%" height={80} borderRadius={16} />
                </div>
            </article>
         </main>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/products" className={styles.backLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          返回列表
        </Link>

        <div className={styles.iconActions}>
          <button className={styles.iconBtn} onClick={handleEdit} title="编辑资料">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => setShowDeleteConfirm(true)} title="删除记录">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {/* Left: Sticky Image Gallery */}
        <aside className={styles.imageSection}>
          <div className={styles.galleryContainer}>
            <div className={styles.mainImageWrapper} onClick={() => setShowModal(true)}>
              {product.images.length > 0 ? (
                <Image 
                  className={styles.mainImageDisplay}
                  src={product.images[activeImage]} 
                  alt={product.name} 
                  fill
                  unoptimized
                />
              ) : (
                <div style={{ color: 'var(--color-text-dim)', opacity: 0.15 }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {product.images.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {product.images.map((img, index) => (
                <div 
                  key={index} 
                  className={`${styles.thumbnail} ${activeImage === index ? styles.thumbnailActive : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image src={img} alt={`${product.name} ${index}`} width={60} height={60} unoptimized />
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right: Scrollable Content */}
        <article className={styles.detailsSection}>
          <section className={styles.heroContent}>
            <div className={styles.heroLabels}>
              <span className={styles.categoryBadge}>{product.category}</span>
              <span className={styles.codeLabel}># {product.code}</span>
            </div>
            <h1 className={styles.pageTitle}>{product.name}</h1>
          </section>

          <section className={styles.assetSection}>
            <div className={styles.assetCard}>
              <span className={styles.assetLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                单笔起订量
              </span>
              <div className={styles.assetValue}>
                {product.minOrderQty}
                <span className={styles.assetUnit}>件单位</span>
              </div>
            </div>
            <div className={styles.assetCard}>
              <span className={styles.assetLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 8l-4 4-4-4"></path><path d="M12 12V4"></path></svg>
                参考进货单价
              </span>
              <div className={styles.assetValue}>
                ¥{(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className={styles.assetCard}>
              <span className={styles.assetLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                首选供应渠道
              </span>
              <div className={styles.assetValue} style={{ fontSize: '1.25rem' }}>
                {product.channel || '未配置'}
              </div>
            </div>
            <div className={styles.assetCard}>
              <span className={styles.assetLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                创建日期
              </span>
              <div className={styles.assetValue} style={{ fontSize: '1.25rem' }}>
                {new Date(product.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className={styles.assetCard}>
              <span className={styles.assetLabel}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                规格参数
              </span>
              <div className={styles.assetValue} style={{ fontSize: '1.25rem' }}>
                {product.spec || '标准规格'}
              </div>
            </div>
          </section>

          <section className={styles.remarkSection}>
            <span className={styles.assetLabel}>业务补充备注</span>
            <div className={styles.remarkContent}>
              {product.remark || '暂无详细描述...'}
            </div>
          </section>

          <section className={styles.historySection}>
            <div className={styles.sectionHeader}>
              <div className={styles.dot}></div>
              <h3>采购记录</h3>
            </div>
            <div className={styles.historyList}>
              {product.purchaseItems?.length > 0 ? (
                product.purchaseItems.map(item => (
                  <div key={item.id} className={styles.historyItem}>
                    <span className={styles.historyDate}>{new Date(item.purchase.purchaseDate).toLocaleDateString()}</span>
                    <span className={styles.historySupplier}>{item.purchase.supplier.name}</span>
                    <span className={styles.historyPrice}>¥{item.unitPrice.toLocaleString()}</span>
                    <span className={styles.historyQty}>+{item.quantity}</span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>系统暂无此货品的入库历史记录</div>
              )}
            </div>
          </section>
        </article>
      </main>

      {showModal && product.images.length > 0 && <ImageModal src={product.images[activeImage]} onClose={() => setShowModal(false)} />}

      <Modal
        isOpen={showDeleteConfirm}
        title="永久删除货品"
        message="确定要永久删除这件货品信息吗？该操作不可撤销，且会清除相关的流水记录。"
        confirmText="确认删除"
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

const ImageModal = ({ src, onClose }: { src: string; onClose: () => void }) => {
  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.9)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div style={{ position: 'relative', width: '90%', height: '90%', maxWidth: '1200px', maxHeight: '800px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute', top: '-3rem', right: '-3rem',
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: '#fff', padding: '0.75rem', borderRadius: '50%',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', transition: 'all 0.2s ease',
            zIndex: 1001
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <Image 
          src={src} 
          alt="Preview" 
          fill
          style={{ objectFit: 'contain', borderRadius: '8px' }} 
          onClick={(e) => e.stopPropagation()}
          unoptimized
        />
      </div>
    </div>
  );
};
