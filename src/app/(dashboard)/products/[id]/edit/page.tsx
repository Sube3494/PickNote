'use client';

import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CustomSelect } from '@/components/CustomSelect';
import CategorySelector from '@/components/CategorySelector';
import styles from './page.module.css';



export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    categoryId: null as string | null,
    spec: '',
    remark: '',
    channel: '',
    minOrderQty: 0,
  });

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string}>>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const p = result.data;
          setFormData({
            code: p.code,
            name: p.name,
            category: p.category,
            categoryId: p.categoryId || null,
            spec: p.spec || '',
            remark: p.remark || '',
            channel: p.channel || '',
            minOrderQty: p.minOrderQty || 0,
          });
          setImages(p.images || []);
        } else {
          router.push('/products');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // 加载供应商列表
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setSuppliers(result.data || []);
        }
      });
  }, [id, router]);

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
      alert('请输入货品编码和名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, images }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/products/${id}`);
      } else {
        alert(data.message || '更新失败');
      }
    } catch {
      alert('请求失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>正在加载货品信息...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href={`/products/${id}`} className={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            取消修改
          </Link>
          <h1 className={styles.title}>修改货品资料</h1>
          <p className={styles.subtitle}>当前编辑: <span style={{ color: 'var(--color-primary)' }}>{formData.code}</span></p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            基础信息核心
          </h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>店内码 *</label>
              <input 
                name="code"
                className={styles.input}
                value={formData.code}
                onChange={handleChange}
                placeholder="例如: B353"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>所属品类</label>
              <CategorySelector
                value={formData.categoryId || undefined}
                onChange={(id, path) => setFormData({ ...formData, categoryId: id, category: path || '其他' })}
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>货品全名 *</label>
              <input 
                name="name"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入详细的货品名称..."
                required
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
              <label className={styles.label}>首选采销渠道</label>
              <CustomSelect
                value={formData.channel}
                onChange={(val) => setFormData({ ...formData, channel: String(val) })}
                options={suppliers.map(s => ({ label: s.name, value: s.name }))}
                placeholder="供应商名称或渠道"
                footer={
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/suppliers';
                    }}
                    style={{ 
                      color: 'var(--color-primary)', 
                      fontSize: '0.8125rem', 
                      fontWeight: 700,
                      textAlign: 'center',
                      padding: '4px 0',
                      cursor: 'pointer'
                    }}
                  >
                    + 新增/管理供应商
                  </div>
                }
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            视觉图库管理
          </h2>
          <div className={styles.imageGrid}>
            {images.map((img, index) => (
              <div key={index} className={styles.imageItem}>
                <div className={styles.imageContainer}>
                  <Image 
                    src={img} 
                    alt="preview" 
                    fill 
                    className={styles.previewImg} 
                    sizes="(max-width: 768px) 100vw, 200px"
                    unoptimized
                  />
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => removeImage(index)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            {isUploading ? (
              <div className={styles.uploadBtn}>
                <div className={styles.uploadIcon} style={{ animation: 'spin 1s linear infinite' }}>⌛</div>
                <span className={styles.uploadText}>正在同步...</span>
              </div>
            ) : (
              <div className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                <div className={styles.uploadIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              业务备注说明
           </h2>
           <textarea 
             name="remark"
             className={styles.textarea}
             value={formData.remark}
             onChange={handleChange}
             placeholder="输入任何关于此货品的额外注意事项..."
           />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? '正在同步数据...' : '确认并提交修改'}
          </button>
          <Link href={`/products/${id}`} className={styles.cancelBtn}>放弃本次更改</Link>
        </div>
      </form>

    </div>
  );
}
