'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
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
    spec: '',
    remark: '',
    channel: '',
    minOrderQty: 0,
  });

  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.data.map((c: any) => c.name));
        }
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        showToast('货品档案已成功建立', 'success');
        router.push('/products');
      } else {
        showToast(data.message || '保存失败', 'error');
      }
    } catch (error) {
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
            返回档案
          </Link>
          <h1 className={styles.title}>新增货品档案</h1>
          <p className={styles.subtitle}>创建一个唯一的货品编码，并记录其详细信息</p>
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
              <div className={styles.selectWrapper} ref={dropdownRef}>
                <div 
                  className={`${styles.input} ${styles.selectTrigger} ${isDropdownOpen ? styles.selectTriggerOpen : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{formData.category || '请选择分类'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {categories.map(cat => (
                      <div 
                        key={cat} 
                        className={`${styles.dropdownOption} ${formData.category === cat ? styles.dropdownOptionActive : ''}`}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: cat }));
                          setIsDropdownOpen(false);
                        }}
                      >
                        {cat}
                        {formData.category === cat && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    ))}
                    <div className={styles.dropdownDivider}></div>
                    <div 
                      className={`${styles.dropdownOption} ${styles.addOption}`}
                      onClick={() => {
                        setShowAddCategoryModal(true);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      <span>新增品类...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>货品全名 *</label>
              <input 
                name="name"
                placeholder="详尽的名称有助于之后筛选和统计"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>规格说明</label>
              <input 
                name="spec"
                placeholder="例如: 200g/盒, 10个装"
                className={styles.input}
                value={formData.spec}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>主要采销渠道</label>
              <input 
                name="channel"
                placeholder="例如: 1688, 微信群..."
                className={styles.input}
                value={formData.channel}
                onChange={handleChange}
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
                <img src={img} alt="preview" className={styles.previewImg} />
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
             placeholder="其他辅助记录信息..."
             value={formData.remark}
             onChange={handleChange}
           />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary submitBtn" disabled={isSubmitting}>
            {isSubmitting ? '正在提交...' : '确认并保存档案'}
          </button>
          <Link href="/products" className="btn btn-secondary cancelBtn">取消</Link>
        </div>
      </form>

      <Modal 
        isOpen={showAddCategoryModal}
        title="新增品类"
        placeholder="请输入新品类名称..."
        showInput={true}
        onConfirm={(val) => {
          if (val.trim()) {
            setFormData(prev => ({ ...prev, category: val.trim() }));
          }
          setShowAddCategoryModal(false);
        }}
        onClose={() => setShowAddCategoryModal(false)}
      />
    </div>
  );
}
