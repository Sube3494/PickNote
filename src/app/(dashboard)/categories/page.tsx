'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface Category {
  name: string;
  count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      showToast('获取品类列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRename = async (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingName(null);
      return;
    }

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCategories();
      } else {
        showToast(data.error || '重命名失败', 'error');
      }
    } catch {
      showToast('操作失败，请检查网络', 'error');
    } finally {
      setEditingName(null);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCategories();
      } else {
        showToast(data.error || '删除失败', 'error');
      }
    } catch {
      showToast('操作失败，请检查网络', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>货品分类信息库</h1>
        <p className={styles.subtitle}>穿透底层货品逻辑，建立稳健、可扩展的品类体系</p>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>全库品类仪表盘</h2>
            <p className={styles.sectionDesc}>
              {loading ? '正在同步云端分类数据...' : `系统当前共识别到 ${categories.length} 个活跃货品分类`}
            </p>
          </div>
          <div className={styles.icon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
            正在穿透底层分类索引...
          </div>
        ) : (
          <div className={styles.categoryList}>
            {categories.map(cat => (
              <div key={cat.name} className={styles.categoryItem}>
                {editingName === cat.name ? (
                  <div className={styles.renameBox}>
                    <input 
                      autoFocus
                      className={styles.renameInput}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(cat.name)}
                    />
                    <button className={`${styles.miniBtn} ${styles.saveBtn}`} onClick={() => handleRename(cat.name)}>
                      保存
                    </button>
                    <button className={`${styles.miniBtn} ${styles.cancelBtn}`} onClick={() => setEditingName(null)}>
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.catInfo}>
                      <span className={styles.catName}>{cat.name}</span>
                      <span className={styles.catCount}>{cat.count} 项关联货品</span>
                    </div>
                    <div className={styles.catActions}>
                      <button 
                        className={styles.miniBtn} 
                        onClick={() => { setEditingName(cat.name); setNewName(cat.name); }}
                        title="重命名(全库同步更新)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button 
                        className={`${styles.miniBtn} ${styles.delBtn}`} 
                        onClick={() => setDeleteConfirm(cat.name)}
                        title="彻底注销分类"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {!loading && categories.length === 0 && (
              <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem', color: 'var(--color-text-dim)' }}>
                <p style={{ fontWeight: 600 }}>系统暂无活跃货品分类</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>请前往货品信息中心录入新数据以自动初始化品类。</p>
              </div>
            )}
          </div>
        )}
      </section>

      <Modal 
        isOpen={!!deleteConfirm}
        title="确认删除货品分类"
        message={`确定要彻底删除品类 "${deleteConfirm}" 吗？删除后，该品类下的所有关联货品将被自动迁移至 "其他" 默认分类。此操作具有全局穿透性，不可撤销。`}
        confirmText="确认删除"
        type="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
