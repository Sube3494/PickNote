'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ToastContext';
import ImageModal from '@/components/ImageModal';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  spec?: string;
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
  const [categories, setCategories] = useState<string[]>([]);
  const [editForm, setEditForm] = useState({
    code: '',
    name: '',
    category: '',
    spec: '',
    remark: '',
    channel: '',
    minOrderQty: 0,
    images: [] as string[],
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [zoomPos, setZoomPos] = useState({ lensLeft: 0, lensTop: 0, bgX: 0, bgY: 0, show: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 获取分类列表
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const cats = result.data?.map((cat: { name: string }) => cat.name) || [];
          setCategories(cats);
        }
      })
      .catch(console.error);
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
            spec: productData.spec || '',
            remark: productData.remark || '',
            channel: productData.channel || '',
            minOrderQty: productData.minOrderQty,
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
        spec: product.spec || '',
        remark: product.remark || '',
        channel: product.channel || '',
        minOrderQty: product.minOrderQty,
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
        setIsDropdownOpen(false);
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
                    <img 
                      className={`${styles.mainImageDisplay} ${styles.imageSlideOut}`}
                      data-direction={slideDirection}
                      src={(isEditing ? editForm.images : product.images)[previousImage]} 
                      alt={product.name}
                    />
                  )}
                  {/* 当前图片（滑入） */}
                  <img 
                    className={`${styles.mainImageDisplay} ${isTransitioning ? styles.imageSlideIn : ''}`}
                    data-direction={isTransitioning ? slideDirection : undefined}
                    src={(isEditing ? editForm.images : product.images)[activeImage]} 
                    alt={product.name} 
                    onClick={() => !isEditing && setShowModal(true)}
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
                </div>
              ) : (
                <h1 className={styles.pageTitle}>{product.name}</h1>
              )}
            </div>

            <div className={styles.divider}></div>
            {/* Main Info Section */}
            <div className={styles.mainInfoSection}>
               {/* Basic Info Group */}
               <div className={styles.infoGroup}>
                 <div className={styles.groupHeader}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                   基础资料
                 </div>
                 <div className={styles.groupContent}>
                    <div className={styles.infoField}>
                      <span className={styles.infoLabel}>货品编码</span>
                      {isEditing ? (
                        <input className={styles.infoInput} value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} />
                      ) : <span className={styles.infoValue}>{product.code}</span>}
                    </div>
                    <div className={styles.infoField}>
                      <span className={styles.infoLabel}>所属分类</span>
                      {isEditing ? (
                        <div className={styles.selectWrapper} ref={dropdownRef}>
                          <div className={styles.infoInput} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>{editForm.category}</div>
                          {isDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                              {categories.map(cat => <div key={cat} onClick={() => { setEditForm({...editForm, category: cat}); setIsDropdownOpen(false); }} className={styles.dropdownOption}>{cat}</div>)}
                            </div>
                          )}
                        </div>
                      ) : <div style={{marginTop: '0.25rem'}}><span className={styles.badge}>{product.category}</span></div>}
                    </div>
                 </div>
               </div>

               {/* Metrics Group */}
               <div className={styles.infoGroup}>
                 <div className={styles.groupHeader}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                   关键经营指标
                 </div>
                 <div className={styles.groupContent}>
                    <div className={styles.infoField}>
                      <span className={styles.infoLabel}>当前在库</span>
                      <div className={styles.stockEmphasis}>
                        <span className={`${styles.infoValue} ${product.currentStock <= 5 ? styles.lowStock : ''}`}>
                          {product.currentStock}
                        </span>
                        <span className={styles.unit}>件</span>
                      </div>
                    </div>
                    <div className={styles.infoField}>
                      <span className={styles.infoLabel}>起订要求</span>
                      {isEditing ? (
                        <input type="number" className={styles.infoInput} value={editForm.minOrderQty} onChange={e => setEditForm({...editForm, minOrderQty: parseInt(e.target.value) || 0})} />
                      ) : <span className={styles.infoValue}>{product.minOrderQty} <span className={styles.unitSmall}>件起</span></span>}
                    </div>
                 </div>
               </div>
            </div>

            <div className={styles.divider}></div>

            {/* Supplementary Info */}
            <div className={styles.subInfoSection}>
               <div className={styles.infoField}>
                 <span className={styles.infoLabel}>规格说明</span>
                 {isEditing ? (
                   <input className={styles.infoInput} value={editForm.spec} onChange={e => setEditForm({...editForm, spec: e.target.value})} />
                 ) : <span className={styles.infoValue}>{product.spec || '尚未填写规格'}</span>}
               </div>
               <div className={styles.infoField}>
                 <span className={styles.infoLabel}>核心采购渠道</span>
                 {isEditing ? (
                   <input className={styles.infoInput} value={editForm.channel} onChange={e => setEditForm({...editForm, channel: e.target.value})} />
                 ) : <span className={styles.infoValue}>{product.channel || '未定义渠道'}</span>}
               </div>
               <div className={styles.infoField}>
                  <span className={styles.infoLabel}>货品最后更新</span>
                  <span className={styles.infoValue}>{new Date(product.createdAt).toLocaleDateString()}</span>
               </div>
            </div>

            <div className={styles.remarkSection}>
               <span className={styles.infoLabel}>备注说明</span>
               {isEditing ? (
                 <textarea className={styles.remarkTextarea} value={editForm.remark} onChange={e => setEditForm({...editForm, remark: e.target.value})} rows={3} />
               ) : <div className={styles.remarkBox}>{product.remark || '无补充说明。'}</div>}
            </div>
          </div>

            <div className={styles.divider}></div>

            {/* History Section */}
            <div className={styles.historySection}>
               <div className={styles.groupHeader}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 最近进货动态
               </div>
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

      {showModal && product.images.length > 0 && <ImageModal src={product.images[activeImage]} onClose={() => setShowModal(false)} />}
      <Modal 
        isOpen={showAddCategoryModal} title="新增品类" placeholder="输入新品类名称..." showInput 
        onConfirm={val => { if (val.trim()) setEditForm(prev => ({ ...prev, category: val.trim() })); setShowAddCategoryModal(false); }} 
        onClose={() => setShowAddCategoryModal(false)} 
      />
    </div>
  );
}
