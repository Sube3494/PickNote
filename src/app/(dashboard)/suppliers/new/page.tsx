'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import Link from 'next/link';
import styles from './page.module.css';

export default function NewSupplierPage() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('请输入供应商名称', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        showToast('供应商档案录入成功', 'success');
        router.push('/suppliers');
      } else {
        showToast(data.message || '录入失败', 'error');
      }
    } catch {
      showToast('网络连接异常，请检查网络', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/suppliers" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回渠道列表
          </Link>
          <h1 className={styles.title}>新增供应商档案</h1>
          <p className={styles.subtitle}>建立完善的货源渠道库，方便之后的进货单录入与统计</p>
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            核心档案
          </h2>
          <div className={styles.grid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>供应商名称 (公司或店铺全名) *</label>
              <input 
                name="name"
                placeholder="例如: 某某玩具有限公司 / 拼多多某某小店"
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
                placeholder="姓名或称呼"
                className={styles.input}
                value={formData.contactName}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>联系电话</label>
              <input 
                name="phone"
                placeholder="手机号或座机"
                className={styles.input}
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>渠道类型</label>
              <select 
                name="type"
                className={styles.select}
                value={formData.type}
                onChange={handleChange}
              >
                <option value="1688">1688 (阿里巴巴)</option>
                <option value="拼多多">拼多多 (PDD)</option>
                <option value="微信">微信私域 / 群聊</option>
                <option value="淘宝">淘宝 / 天猫</option>
                <option value="线下">线下市场 / 档口</option>
                <option value="其他">其他渠道</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>具体经营地址</label>
              <input 
                name="address"
                placeholder="发货地址或办公地址"
                className={styles.input}
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            备注说明
          </h2>
          <textarea 
            name="remark"
            className={styles.textarea}
            placeholder="例如: 该供应商发货较慢、产品质量极佳、不包邮等关键信息..."
            value={formData.remark}
            onChange={handleChange}
          />
        </section>

        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary submitBtn" disabled={isSubmitting}>
            {isSubmitting ? '保存云端中...' : '确认录入供应商档案'}
          </button>
          <Link href="/suppliers" className="btn btn-secondary cancelBtn">放弃录入</Link>
        </div>
      </form>
    </div>
  );
}
