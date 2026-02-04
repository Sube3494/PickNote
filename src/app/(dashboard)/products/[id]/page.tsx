'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ToastContext';
import CategorySelector from '@/components/CategorySelector';
import styles from './page.module.css';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryId?: string | null;
  remark?: string;
  images: string[];
  currentStock: number;
  channel?: string;
  minOrderQty: number;
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
  const [previousImage, setPreviousImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    category: '',
    categoryId: null as string | null,
    remark: '',
    channel: '',
    minOrderQty: 0,
    currentStock: 0,
    images: [] as string[],
  });
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string; type: string; contactName?: string}>>([]);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ lensLeft: 0, lensTop: 0, bgX: 0, bgY: 0, show: false });
  const supplierRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setIsSupplierOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 加载供应商列表
  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setSuppliers(result.data || []);
        }
      });
  }, []);

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
          
          const productData = {
            ...result.data,
            images
          };
          setProduct(productData);
          // 初始化编辑表单
          setEditForm({
            code: productData.code,
            name: productData.name,
            category: productData.category,
            categoryId: productData.categoryId || null,
            remark: productData.remark || '',
            channel: productData.channel || '',
            minOrderQty: productData.minOrderQty,
            currentStock: productData.currentStock,
            images: productData.images,
          });
        } else {
          showToast(result.message || '加载失败', 'error');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // 恢复原始数据
    if (product) {
      setEditForm({
        code: product.code,
        name: product.name,
        category: product.category,
        categoryId: product.categoryId || null,
        remark: product.remark || '',
        channel: product.channel || '',
        minOrderQty: product.minOrderQty,
        currentStock: product.currentStock,
        images: product.images,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        setIsEditing(false);
        setIsSupplierOpen(false);
        showToast('保存成功', 'success');
      } else {
        showToast(data.message || '保存失败', 'error');
      }
    } catch (error) {
      showToast('保存失败', 'error');
      console.error(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      showToast('正在上传图片...', 'info');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEditForm(prev => ({
          ...prev,
          images: [...prev.images, ...data.data]
        }));
        showToast('图片上传成功', 'success');
      } else {
        showToast(data.message || '上传失败', 'error');
      }
    } catch (error) {
      showToast('上传失败', 'error');
      console.error(error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    if (activeImage >= editForm.images.length - 1) {
      setActiveImage(Math.max(0, editForm.images.length - 2));
    }
  };

  const handlePrevImage = () => {
    const images = isEditing ? editForm.images : product?.images || [];
    if (images.length <= 1 || isTransitioning) return;
    
    setPreviousImage(activeImage);
    setSlideDirection('left');
    setIsTransitioning(true);
    
    const nextIndex = activeImage === 0 ? images.length - 1 : activeImage - 1;
    setActiveImage(nextIndex);
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNextImage = () => {
    const images = isEditing ? editForm.images : product?.images || [];
    if (images.length <= 1 || isTransitioning) return;
    
    setPreviousImage(activeImage);
    setSlideDirection('right');
    setIsTransitioning(true);
    
    const nextIndex = activeImage === images.length - 1 ? 0 : activeImage + 1;
    setActiveImage(nextIndex);
    
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Lens dimensions (200px from CSS) and Container dimensions (520px)
    // Dynamic calculation would be better but fixed is safer for reliability with CSS modules
    const lensSize = 200;
    const containerSize = rect.width; // Should be around 520

    // Calculate top-left position of the lens
    let lensLeft = x - lensSize / 2;
    let lensTop = y - lensSize / 2;

    // Clamp values
    const maxLeft = containerSize - lensSize;
    const maxTop = rect.height - lensSize;

    lensLeft = Math.max(0, Math.min(lensLeft, maxLeft));
    lensTop = Math.max(0, Math.min(lensTop, maxTop));

    // Calculate percentage for background position
    // logic: when lens is at 0, bg is 0%. when lens is at max, bg is 100%.
    const bgX = (lensLeft / maxLeft) * 100;
    const bgY = (lensTop / maxTop) * 100;

    // Store pixels for lens position, percent for background
    setZoomPos({ 
      // For lens element (pixels, relative to container)
      lensLeft, 
      lensTop, 
      // For background image (percentage)
      bgX, 
      bgY, 
      show: true 
    });
  };

  const handleDelete = async () => {
    if (!confirm('确定要永久删除这件货品信息吗？该操作不可撤销。')) return;

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
    }
  };

  if (loading) return <div className={styles.loading}>加载数据中...</div>;
  if (!product) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/products" className={styles.backLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            返回货品信息
          </Link>
        </div>

        <div className={styles.iconActions}>
          {isEditing ? (
            <>
              <button className={styles.iconBtn} onClick={handleSave} title="保存更改">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
              <button className={styles.iconBtn} onClick={handleCancel} title="取消">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </>
          ) : (
            <>
              <button className={styles.iconBtn} onClick={handleEdit} title="编辑信息">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={handleDelete} title="删除记录">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </>
          )}
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.productCard}>
          {/* Gallery Section */}
        <div className={styles.imageSection}>
          <div className={styles.galleryContainer} style={{ width: 400, height: 400 }}>
            <div 
              className={styles.mainImageWrapper} 
              ref={mainImageRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => !isEditing && setZoomPos(prev => ({ ...prev, show: true }))}
              onMouseLeave={() => setZoomPos(prev => ({ ...prev, show: false }))}
            >
              {(isEditing ? editForm.images : product.images).length > 0 ? (
                <>
                  {/* 过渡中显示前一张图片（滑出） */}
                  {isTransitioning && (
                    <Image 
                      className={`${styles.mainImageDisplay} ${styles.imageSlideOut}`}
                      data-direction={slideDirection}
                      src={(isEditing ? editForm.images : product.images)[previousImage]} 
                      alt={product.name}
                      fill
                      unoptimized
                    />
                  )}
                  {/* 当前图片（滑入） */}
                  <Image 
                    className={`${styles.mainImageDisplay} ${isTransitioning ? styles.imageSlideIn : ''}`}
                    data-direction={isTransitioning ? slideDirection : undefined}
                    src={(isEditing ? editForm.images : product.images)[activeImage]} 
                    alt={product.name} 
                    onClick={() => !isEditing && setShowModal(true)}
                    fill
                    unoptimized
                  />
                  {!isEditing && zoomPos.show && (
                    <div 
                      className={styles.zoomLens} 
                      style={{ 
                        left: zoomPos.lensLeft, 
                        top: zoomPos.lensTop
                      }} 
                    />
                  )}
                </>
              ) : (
                <div className={styles.pNoImg}><span>{product.name.charAt(0)}</span></div>
              )}
            </div>

            {(isEditing ? editForm.images : product.images).length > 1 && (
              <div className={styles.galleryNav}>
                <button className={styles.navBtn} onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button className={styles.navBtn} onClick={(e) => { e.stopPropagation(); handleNextImage(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}

          </div>

          {!isEditing && zoomPos.show && (isEditing ? editForm.images : product.images).length > 0 && (
            <div className={styles.zoomWindow}>
               <div 
                 style={{
                   width: '100%',
                   height: '100%',
                   backgroundImage: `url(${(isEditing ? editForm.images : product.images)[activeImage]})`,
                   backgroundPosition: `${zoomPos.bgX}% ${zoomPos.bgY}%`,
                   backgroundSize: '260%',
                   backgroundRepeat: 'no-repeat'
                 }} 
               />
            </div>
          )}

          <div className={styles.thumbnailGrid}>
            {(isEditing ? editForm.images : product.images).map((img, index) => (
              <div 
                key={index} 
                className={`${styles.thumbnail} ${activeImage === index ? styles.thumbnailActive : ''}`}
                onClick={() => setActiveImage(index)}
              >
                <Image src={img} alt={`${product.name} ${index}`} width={64} height={64} className={styles.mainThumbnailFill} />
                {isEditing && (
                  <button className={styles.removeImageBtn} onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <label className={styles.uploadBtn}>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className={styles.hiddenInput} />
                <div className={styles.uploadIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
              </label>
            )}
          </div>
          </div>

          <div className={styles.detailsSection}>
          <div className={styles.detailsCard}>
            {/* Embedded Title Section */}
            <div className={styles.titleSection}>
              {isEditing ? (
                <div className={styles.fieldFull}>
                  <label className={styles.infoLabel}>货品名称</label>
                  <input 
                    className={styles.titleInput} 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                    placeholder="请输入货品完整名称"
                  />
                   <div className={styles.headerMeta}>
                      <div className={styles.infoField}>
                        <span className={styles.infoLabel}>货品编码</span>
                        <input className={styles.infoInput} value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} />
                      </div>
                      <div className={styles.infoField}>
                        <span className={styles.infoLabel}>分类</span>
                        <CategorySelector 
                          value={editForm.categoryId || undefined}
                          onChange={(categoryId, categoryPath) => {
                            setEditForm({
                              ...editForm, 
                              categoryId,
                              category: categoryPath || ''
                            });
                          }}
                        />
                      </div>
                   </div>
                </div>
              ) : (
                <>
                  <h1 className={styles.pageTitle}>{product.name}</h1>
                  <div className={styles.headerMeta}>
                    <div className={styles.metaBadge}>
                      <span className={styles.infoLabel}>编码</span>
                      {product.code}
                    </div>
                    <div className={styles.metaBadge}>
                      <span className={styles.infoLabel}>分类</span>
                      {product.category}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Stats Card */}
              <div className={styles.statsCard}>
               <div className={styles.statItem}>
                 <span className={styles.statLabel}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                   当前库存
                 </span>
                 <div className={styles.stockEmphasis}>
                   <span className={`${styles.infoValue} ${product.currentStock <= 5 ? styles.lowStock : ''} ${isEditing ? styles.hidden : ''}`}>
                     {product.currentStock}
                   </span>
                   {isEditing && (
                      <input 
                        type="number" 
                        className={styles.transparentInput} 
                        style={{fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', width: '80px', textAlign: 'left'}} 
                        value={editForm.currentStock} 
                        onChange={e => setEditForm({...editForm, currentStock: parseInt(e.target.value) || 0})} 
                      />
                   )}
                   <span className={styles.unit}>件</span>
                 </div>
               </div>
               
               <div style={{width: '1px', height: '40px', background: 'var(--color-border-subtle)'}}></div>

               <div className={styles.statItem}>
                 <span className={styles.statLabel}>起订要求</span>
                 <div style={{display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                   {isEditing ? (
                      <input 
                        type="number" 
                        className={styles.transparentInput} 
                        style={{fontSize: '1.25rem', fontWeight: 600, width: '50px', textAlign: 'left'}} 
                        value={editForm.minOrderQty} 
                        onChange={e => setEditForm({...editForm, minOrderQty: parseInt(e.target.value) || 0})} 
                      />
                   ) : (
                      <span className={styles.infoValue} style={{fontSize: '1.25rem'}}>{product.minOrderQty}</span>
                   )}
                   <span className={styles.unitSmall}>件起</span>
                 </div>
               </div>
            </div>

            {/* Properties Grid */}
             <div className={styles.propertiesGrid}>
                <div className={styles.infoField}>
                  <span className={styles.infoLabel}>主要采销渠道</span>
                  {isEditing ? (
                    <div className={styles.selectWrapper} ref={supplierRef} style={{marginTop: '4px'}}>
                      <div 
                        className={styles.infoInput} 
                        onClick={() => setIsSupplierOpen(!isSupplierOpen)}
                        style={{cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
                      >
                        <span>{editForm.channel || '关联供应商'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                      {isSupplierOpen && (
                        <div className={styles.dropdownMenu}>
                          {suppliers.map(s => (
                            <div 
                              key={s.id} 
                              onClick={() => { setEditForm({...editForm, channel: s.name}); setIsSupplierOpen(false); }} 
                              className={styles.dropdownOption}
                            >
                              <div style={{flex: 1}}>
                                <div style={{fontWeight: 600}}>{s.name}</div>
                                <div style={{fontSize: '0.75rem', opacity: 0.6, marginTop: '2px'}}>
                                  {s.type} {s.contactName && `· ${s.contactName}`}
                                </div>
                              </div>
                              {editForm.channel === s.name && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </div>
                          ))}
                          <div className={styles.dropdownDivider}></div>
                          <Link href="/suppliers/new" className={`${styles.dropdownOption} ${styles.addOption}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                            <span>新增供应商</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : <span className={styles.infoValue}>{product.channel || '—'}</span>}
                </div>
                <div className={styles.infoField}>
                   <span className={styles.infoLabel}>最后更新</span>
                   <span className={styles.infoValue}>{new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
             </div>

            {/* Remark */}
            <div className={styles.remarkSection}>
               <span className={styles.remarkLabel}>备注说明</span>
               {isEditing ? (
                 <textarea className={styles.remarkTextarea} style={{marginTop: '0.5rem'}} value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} rows={3} />
               ) : <div className={styles.remarkBox} style={{marginTop: '0.5rem', border: 'none', background: 'transparent', padding: 0, minHeight: 'auto'}}>{product.remark || '暂无补充说明。'}</div>}
            </div>
            {/* History Section - Merged */}
            <div className={styles.divider} style={{margin: '1.5rem 0'}}></div>
            <div className={styles.historySection}>
               <span className={styles.sectionLabel}>最近进货动态</span>
               <div className={styles.historyTableWrapper}>
                 {product.purchaseItems?.length > 0 ? (
                   <table className={styles.historyTable}>
                     <thead>
                       <tr><th>进货日期</th><th>承运供应商</th><th>结算单价</th><th>入库数量</th></tr>
                     </thead>
                     <tbody>
                       {product.purchaseItems.map(item => (
                         <tr key={item.id}>
                           <td>{new Date(item.purchase.purchaseDate).toLocaleDateString()}</td>
                           <td>{item.purchase.supplier.name}</td>
                           <td style={{color: 'var(--color-primary)'}}>¥ {item.unitPrice}</td>
                           <td style={{fontWeight: 800}}>+ {item.quantity}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 ) : <div className={styles.emptyHistory}>暂无采供入库记录。</div>}
               </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {showModal && product.images.length > 0 && <ImageModal src={product.images[activeImage]} onClose={() => setShowModal(false)} />}
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
