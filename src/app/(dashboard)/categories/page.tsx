'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
import { CustomSelect } from '@/components/CustomSelect';
import styles from './page.module.css';

interface Category {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  order: number;
  count: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', level: 1, parentId: '' });
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
      showToast('获取分类列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
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
      setEditingId(null);
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
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

  const handleAddCategory = async () => {
    if (!addForm.name.trim()) {
      showToast('分类名称不能为空', 'error');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          level: addForm.level,
          parentId: addForm.parentId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchCategories();
        setShowAddModal(false);
        setAddForm({ name: '', level: 1, parentId: '' });
      } else {
        showToast(data.error || '创建失败', 'error');
      }
    } catch {
      showToast('操作失败，请检查网络', 'error');
    }
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);
    const isEditing = editingId === category.id;

    return (
      <div key={category.id} className={styles.categoryNode}>
        <div 
          className={styles.categoryItem} 
          style={{ paddingLeft: `${depth * 2}rem` }}
          data-level={category.level}
        >
          {hasChildren && (
            <button
              className={styles.expandBtn}
              onClick={() => toggleExpand(category.id)}
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
          
          {isEditing ? (
            <div className={styles.renameBox}>
              <input
                autoFocus
                className={styles.renameInput}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(category.id)}
              />
              <button className={`${styles.miniBtn} ${styles.saveBtn}`} onClick={() => handleRename(category.id)}>
                保存
              </button>
              <button className={`${styles.miniBtn} ${styles.cancelBtn}`} onClick={() => setEditingId(null)}>
                取消
              </button>
            </div>
          ) : (
            <>
              <div className={styles.catInfo}>
                <span className={styles.levelBadge}>L{category.level}</span>
                <span className={styles.catName}>{category.name}</span>
                <span className={styles.catCount}>{category.count} 项</span>
              </div>
              <div className={styles.catActions}>
                <button
                  className={styles.miniBtn}
                  onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                  title="重命名"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                {category.level < 3 && (
                  <button
                    className={`${styles.miniBtn} ${styles.addBtn}`}
                    onClick={() => {
                      setAddForm({ name: '', level: category.level + 1, parentId: category.id });
                      setShowAddModal(true);
                    }}
                    title="添加子分类"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                )}
                <button
                  className={`${styles.miniBtn} ${styles.delBtn}`}
                  onClick={() => setDeleteConfirm(category)}
                  title="删除分类"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className={styles.childrenContainer}>
            {category.children?.map(child => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAllCategories = (cats: Category[]): Category[] => {
    let result: Category[] = [];
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children) {
        result = result.concat(getAllCategories(cat.children));
      }
    });
    return result;
  };

  const flatCategories = getAllCategories(categories);
  const parentOptions = flatCategories.filter(c => c.level < 3);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>货品分类信息库</h1>
          <p className={styles.subtitle}>支持1-3级树形分类，灵活组织货品结构</p>
        </div>
        <button className={`btn ${styles.primaryBtn}`} onClick={() => { setAddForm({ name: '', level: 1, parentId: '' }); setShowAddModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          新增分类
        </button>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>分类树</h2>
            <p className={styles.sectionDesc}>
              {loading ? '正在加载...' : `当前共 ${flatCategories.length} 个分类（${categories.length} 个一级分类）`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
            正在加载分类数据...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--color-text-dim)' }}>
            <p style={{ fontWeight: 600 }}>暂无分类</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>点击右上角&quot;新增分类&quot;按钮创建第一个分类</p>
          </div>
        ) : (
          <div className={styles.categoryTree}>
            {categories.map(cat => renderCategory(cat))}
          </div>
        )}
      </section>

      {/* 新增分类弹窗 */}
      <Modal
        isOpen={showAddModal}
        title="新增分类"
        onClose={() => setShowAddModal(false)}
        onConfirm={() => handleAddCategory()}
        confirmText="创建"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              分类名称
            </label>
            <input
              type="text"
              className={styles.modalInput}
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="请输入分类名称"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              层级
            </label>
            <CustomSelect
              value={addForm.level}
              onChange={(val) => setAddForm({ ...addForm, level: Number(val), parentId: '' })}
              options={[
                { label: '一级分类', value: 1 },
                { label: '二级分类', value: 2 },
                { label: '三级分类', value: 3 },
              ]}
              placeholder="请选择层级"
            />
          </div>
          {addForm.level > 1 && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
                父分类
              </label>
              <CustomSelect
                value={addForm.parentId}
                onChange={(val) => setAddForm({ ...addForm, parentId: String(val) })}
                options={parentOptions
                  .filter(c => c.level === addForm.level - 1)
                  .map(c => ({
                    label: `${c.name} (L${c.level})`,
                    value: c.id
                  }))}
                placeholder="请选择父分类"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={!!deleteConfirm}
        title="确认删除分类"
        message={deleteConfirm ? `确定要删除分类 "${deleteConfirm.name}" 吗？${deleteConfirm.children && deleteConfirm.children.length > 0 ? `\n\n⚠️ 该分类下有 ${deleteConfirm.children.length} 个子分类将一并删除。` : ''}${deleteConfirm.count > 0 ? `\n\n关联的 ${deleteConfirm.count} 个货品将解除分类关联。` : ''}\n\n此操作不可撤销！` : ''}
        confirmText="确认删除"
        type="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
