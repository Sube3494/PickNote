'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import CategorySelector from '@/components/CategorySelector';
import { CustomSelect } from '@/components/CustomSelect';
import Link from 'next/link';
import styles from './page.module.css';

export default function NewProductPage() {
  const router = useRouter();
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
        router.push('/products');
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
          <Link href="/products" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回列表
          </Link>
          <h1 className={styles.title}>新增货品信息</h1>
          <p className={styles.subtitle}>记录货品的核心信息，关联首选采销渠道</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            基础信息
          </h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>店内码 (唯一标识) *</label>
              <input 
                name="code"
                placeholder="例如: B03"
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
                placeholder="作为识别货品的首要依据"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.fieldFull}>
              <label className={styles.label}>主要采销渠道 (关联供应商)</label>
              <CustomSelect
                value={formData.channel}
                onChange={(val) => setFormData(prev => ({ ...prev, channel: String(val) }))}
                options={suppliers.map(s => ({
                  label: s.name,
                  value: s.name,
                  subtitle: `${s.type} · ${s.contactName || '无记录'}`
                }))}
                placeholder="关联一个已存在的供应商"
                className={styles.select}
                footer={
                  <Link href="/suppliers/new" className={styles.addOption}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 0.75rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <span>去录入供应商...</span>
                    </div>
                  </Link>
                }
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            图库管理
          </h2>
          <div className={styles.imageGrid}>
            {images.map((img, index) => (
              <div key={index} className={styles.imageItem}>
                <Image src={img} alt="preview" fill className={styles.previewImg} sizes="(max-width: 768px) 100vw, 150px" />
                <button type="button" className={styles.removeBtn} onClick={() => removeImage(index)}>
                  ×
                </button>
              </div>
            ))}
            {isUploading ? (
              <div className={styles.uploadBtn}>
                <div className={styles.uploadIcon}>⌛</div>
                <span className={styles.uploadText}>上传中...</span>
              </div>
            ) : (
              <div className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <div className={styles.uploadIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span className={styles.uploadText}>添加图片</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  multiple 
                  accept="image/*"
                  hidden
                />
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
           <h2 className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              补充备注
           </h2>
           <textarea 
             name="remark"
             className={styles.textarea}
             placeholder="其他辅助记录信息，如材质、保质期等..."
             value={formData.remark}
             onChange={handleChange}
           />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary submitBtn" disabled={isSubmitting}>
            {isSubmitting ? '正在提交...' : '确认并保存信息'}
          </button>
          <Link href="/products" className="btn btn-secondary cancelBtn">取消</Link>
        </div>
      </form>

    </div>
  );
}
