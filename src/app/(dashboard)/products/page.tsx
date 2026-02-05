'use client';

import { useEffect, useState, useCallback } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastContext';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  spec?: string;
  images: string[];
  currentStock: number;
  createdAt: string;
}

interface Category {
  name: string;
  count: number;
}

export default function ProductsPage() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 封装通用的安全抓取逻辑
  const safeFetch = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) throw new Error('Not JSON');
    return res.json();
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载品类
      const catData = await safeFetch('/api/categories');
      if (catData.success) setCategories(catData.data);

      // 加载货品
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (selectedCategory !== '全部') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);

      const prodData = await safeFetch(`/api/products?${params}`);
      if (prodData.success) {
        setProducts(prodData.data);
        setTotalPages(prodData.pagination.totalPages);
        setTotalCount(prodData.pagination.total);
      }
    } catch (err) {
      console.error('Data Load Error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, searchQuery]);


  useEffect(() => {
    loadData();
  }, [loadData]);


  // 批量删除处理
  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      showToast(`成功移除 ${selectedIds.size} 项货品信息`, 'success');
      
      setSelectedIds(new Set());
      loadData(); // 重新加载当前页数据
    } catch (error) {
      console.error('批量删除失败:', error);
      showToast('删除操作未能完全执行', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // 切换选择
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>货品信息中心</h1>
          <p className={styles.subtitle}>
            多维检索与资产流转·<span className={styles.highlight}>当前共存 {totalCount} 项</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/products/import" className={styles.secondaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            批量导入
          </Link>
          <Link href="/products/new" className={styles.primaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            新增货品
          </Link>
        </div>
      </header>

      <div className={styles.filtersGlass}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="搜索货品名称、编码、条码或品类..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button 
              className={styles.searchClear} 
              onClick={() => {setSearchQuery(''); setPage(1);}}
              title="清除搜索"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>
        
        <div className={`${styles.categoryScroller} u-flex-center`}>
          <button
            className={`${styles.tabBtn} ${selectedCategory === '全部' ? styles.tabActive : ''}`}
            onClick={() => {
              setSelectedCategory('全部');
              setPage(1);
            }}
          >
            全部货品
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`${styles.tabBtn} ${selectedCategory === cat.name ? styles.tabActive : ''}`}
              onClick={() => {
                setSelectedCategory(cat.name);
                setPage(1);
              }}
            >
              {cat.name}
              <span className={styles.badge}>{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? null : products.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
          </div>
          <h3>未找到匹配货品</h3>
          <p>请尝试精简搜索条件或选择其他品类。</p>
          <button className={styles.emptyReset} onClick={() => {setSearchQuery(''); setSelectedCategory('全部');}}>重置全部筛选</button>
        </div>
      ) : (
        <div className={styles.mainGridWrapper}>
          <div className={styles.premiumGrid}>
            {products.map((product) => (
                <Link 
                  key={product.id}
                  href={`/products/${product.id}`} 
                  className={`${styles.pCard} ${selectedIds.has(product.id) ? styles.pCardSelected : ''}`}
                >
                  <div className={styles.visualContainer}>
                    {product.images && product.images.length > 0 ? (
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className={styles.pImg}
                      />
                    ) : (
                      <div className={styles.pNoImg}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </div>
                    )}
                    {product.currentStock > 0 && (
                      <div className={styles.topStatus}>
                        <span className={`${styles.stockBadge} ${product.currentStock > 10 ? styles.stockOK : styles.stockWarning}`}>
                          {product.currentStock > 10 ? '货源充足' : `仅剩 ${product.currentStock} 件`}
                        </span>
                      </div>
                    )}

                    {/* 圆形复选框：右上角 */}
                    <div className={styles.selectArea} onClick={(e) => toggleSelect(product.id, e)}>
                      <div className={`${styles.customCheck} ${selectedIds.has(product.id) ? styles.checked : ''}`}>
                        {selectedIds.has(product.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.pContent}>
                    <div className={styles.pMeta}>
                      <span className={styles.pCode}>{product.code}</span>
                      <span className={styles.pTag}>{product.category}</span>
                    </div>
                    <h3 className={styles.pTitle} title={product.name}>{product.name}</h3>
                    <div className={styles.pInfoRow}>
                      <div className={styles.pMainInfo}>
                         <p className={styles.pSubtext}>库存: <span className={styles.stockCount}>{product.currentStock}</span> 件</p>
                      </div>
                      <div className={styles.pActionIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </div>
                    </div>
                  </div>
                </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationCenter}>
              <div className={styles.pager}>
                <button
                  className={styles.pageArrow}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div className={styles.pageNumbers}>
                   <span className={styles.muted}>第</span>
                   <span className={styles.current}>{page}</span>
                   <span className={styles.muted}>页 / 共 {totalPages} 页</span>
                </div>
                <button
                  className={styles.pageArrow}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 底部浮动操作栏 */}
      {selectedIds.size > 0 && (
        <div className={styles.floatingActionBar}>
          <div className={styles.actionContent}>
            <div className={styles.selectionInfo}>
              <button 
                className={styles.actionSelectAll}
                onClick={toggleSelectAll}
              >
                <div className={`${styles.customCheck} ${selectedIds.size === products.length ? styles.checked : ''}`}>
                  {selectedIds.size === products.length && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                全选
              </button>
              <span className={styles.countText}>已选中 <span className={styles.countNum}>{selectedIds.size}</span> 项货品</span>
            </div>
            <div className={styles.actionButtons}>
              <button 
                className={styles.actionCancel}
                onClick={() => setSelectedIds(new Set())}
              >
                取消
              </button>
              <button 
                className={styles.actionDelete}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                {isDeleting ? '处理中...' : '批量删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal 
        key={showDeleteConfirm ? 'delete-confirm' : 'modal-closed'}
        isOpen={showDeleteConfirm}
        title="确认批量删除"
        message={`确定要彻底删除选中的 ${selectedIds.size} 个货品信息吗？该操作不可撤销，且会清除相关的流水记录。`}
        confirmText="确认删除"
        type="danger"
        onConfirm={handleBatchDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />

    </div>
  );
}
