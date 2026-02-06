'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';
import { CustomSelect } from '@/components/CustomSelect';
import styles from './page.module.css';

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    address: '',
    type: '1688',
    remark: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierTypes = [
    { value: '1688', label: '1688 (阿里巴巴)' },
    { value: '拼多多', label: '拼多多 (PDD)' },
    { value: '微信', label: '微信私域 / 群聊' },
    { value: '淘宝', label: '淘宝 / 天猫' },
    { value: '线下', label: '线下市场 / 档口' },
    { value: '其他', label: '其他渠道' }
  ];

  useEffect(() => {
    fetch(`/api/suppliers/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const s = result.data;
          setFormData({
            name: s.name,
            contactName: s.contactName || '',
            phone: s.phone || '',
            address: s.address || '',
            type: s.type,
            remark: s.remark || '',
          });
        } else {
          router.push('/suppliers');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (val: string | number) => {
    setFormData(prev => ({ ...prev, type: String(val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('请输入供应商名称', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('供应商资料更新成功', 'success');
        router.push('/suppliers');
      } else {
        showToast(data.message || '更新失败', 'error');
      }
    } catch {
      showToast('网络连接异常', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>正在全线读取供应商信息...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/suppliers" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回列表
          </Link>
          <h1 className={styles.title}>修改供应商信息</h1>
          <p className={styles.subtitle}>正在更新: <b>{formData.name}</b> 的渠道档案</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            核心渠道信息
          </h2>
          <div className={styles.grid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>供应商名称 (公司或店铺全名) *</label>
              <input 
                name="name"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>主要联系人</label>
              <input 
                name="contactName"
                className={styles.input}
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>联系电话</label>
              <input 
                name="phone"
                className={styles.input}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>渠道类型</label>
              <CustomSelect
                options={supplierTypes}
                value={formData.type}
                onChange={handleTypeChange}
                placeholder="选择渠道类型"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>具体经营地址</label>
              <input 
                name="address"
                className={styles.input}
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            备注说明
          </h2>
          <textarea 
            name="remark"
            className={styles.textarea}
            value={formData.remark}
            onChange={handleChange}
          />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                正在同步...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                同步更新资料
              </>
            )}
          </button>
          <Link href="/suppliers" className={styles.cancelBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            放弃修改
          </Link>
        </div>
      </form>
    </div>
  );
}
