'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import CategorySelector from '@/components/CategorySelector';
import { CustomSelect } from '@/components/CustomSelect';
import Link from 'next/link';
import styles from './page.module.css';

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const backUrl = from === 'dashboard' ? '/' : '/products';
  
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    categoryId: null as string | null,
    remark: '',
    channel: '',
    minOrderQty: 0,
    unit: '件',
    spec: '',
    price: 0,
  });

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string; type: string; contactName?: string}>>([]);

  useEffect(() => {
    // 加载供应商
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuppliers(data.data);
        }
      });
  }, []);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploading(true);
    const files = Array.from(e.target.files);
    const data = new FormData();
    files.forEach(file => data.append('files', file));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success) {
        setImages(prev => [...prev, ...result.data]);
        showToast(`已成功上传 ${result.data.length} 张图片`, 'success');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const unitOptions = [
    { label: '个', value: '个' },
    { label: '件', value: '件' },
    { label: '套', value: '套' },
    { label: '盒', value: '盒' },
    { label: '罐', value: '罐' },
    { label: '包', value: '包' },
    { label: '公斤', value: '公斤' },
    { label: '米', value: '米' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      showToast('请输入货品编码和名称', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('货品信息已保存', 'success');
        router.push(backUrl);
      } else {
        showToast(data.message || '保存失败', 'error');
      }
    } catch {
      showToast('请求失败，请检查网络', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href={backUrl} className={styles.backLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回列表
          </Link>
          <h1 className={styles.title}>新增货品档案</h1>
          <p className={styles.subtitle}>输入核心参数并关联建议采销渠道，构建企业级货品智库</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            基础参数设定
          </h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>货品编码 (SKU ID) *</label>
              <input 
                name="code"
                placeholder="例如: B03-RED-XL"
                className={styles.input}
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>所属品类</label>
              <CategorySelector 
                value={formData.categoryId || undefined}
                onChange={(categoryId, categoryPath) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    categoryId,
                    category: categoryPath || ''
                  }));
                }}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>货品全名 *</label>
              <input 
                name="name"
                placeholder="作为识别货品的首要依据，建议包含品牌及关键特征"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.fieldFull}>
              <label className={styles.label}>核心采销渠道 (关联供应商)</label>
              <CustomSelect
                value={formData.channel}
                onChange={(val) => setFormData(prev => ({ ...prev, channel: String(val) }))}
                options={suppliers.map(s => ({
                  label: s.name,
                  value: s.name,
                  subtitle: `${s.type || '渠道'} · ${s.contactName || '无联系人'}`
                }))}
                placeholder="搜索并关联已存在的供应商渠道"
                footer={
                  <Link href="/suppliers/new" className={styles.addOption}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 0.875rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <span>录入新供应商...</span>
                    </div>
                  </Link>
                }
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>规格参数</label>
              <input 
                name="spec"
                className={styles.input}
                value={formData.spec}
                onChange={handleChange}
                placeholder="如: 500g/罐"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>参考进货单价 (¥)</label>
              <input 
                type="number"
                name="price"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={styles.input}
                value={formData.price}
                onChange={handleChange}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>建议最小起订量 (MOQ) *</label>
              <div className={styles.qtyUnitGroup}>
                <input 
                  type="number"
                  name="minOrderQty"
                  min="0"
                  placeholder="1"
                  className={`${styles.input} ${styles.qtyInput}`}
                  value={formData.minOrderQty}
                  onChange={handleChange}
                />
                <div className={styles.unitSelector}>
                  <CustomSelect
                    value={formData.unit}
                    onChange={(val) => setFormData(prev => ({ ...prev, unit: String(val) }))}
                    options={unitOptions}
                    placeholder="单位"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            视觉图库管理
          </h2>
          <div className={styles.imageGrid}>
            {images.map((img, index) => (
              <div key={index} className={styles.imageItem}>
                <Image src={img} alt="preview" fill className={styles.previewImg} sizes="(max-width: 768px) 100vw, 150px" unoptimized />
                <button type="button" className={styles.removeBtn} onClick={() => removeImage(index)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            <div className={styles.uploadBtn} onClick={() => !isUploading && fileInputRef.current?.click()}>
              {isUploading ? (
                <>
                  <div className={styles.uploadIcon} style={{ animation: 'spin 1s linear infinite' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  </div>
                  <span className={styles.uploadText}>正在同步...</span>
                </>
              ) : (
                <>
                  <div className={styles.uploadIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </div>
                  <span className={styles.uploadText}>上传实拍图</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                multiple 
                accept="image/*"
                hidden
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
           <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              补充备注说明
           </h2>
           <textarea 
             name="remark"
             className={styles.textarea}
             placeholder="输入任何辅助记录的信息（如：材质、保质期、特殊储存要求等）..."
             value={formData.remark}
             onChange={handleChange}
           />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className={`btn ${styles.submitBtn}`} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                正在同步云端...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                确认并保存档案
              </>
            )}
          </button>
          <Link href={backUrl} className={`btn ${styles.cancelBtn}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            取消录入
          </Link>
        </div>
      </form>
    </div>
  );
}
