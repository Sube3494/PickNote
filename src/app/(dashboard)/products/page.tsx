'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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

  const loadData = async () => {
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
      }
    } catch (err) {
      console.error('Data Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery, page]);

  // 批量删除处理
  const handleBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      showToast(`成功移除 ${selectedIds.size} 项资产档案`, 'success');
      
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
    if (e) e.stopPropagation();
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
          <h1 className={styles.title}>货品档案中心</h1>
          <p className={styles.subtitle}>
            构建全维度的资产台账 · 
            <span className={styles.highlight}> {loading ? '加载中...' : `在库 ${products.length} 项`}</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/products/import" className={styles.secondaryBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            批量导入
          </Link>
          <Link href="/products/new" className={styles.primaryBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            新增货品
          </Link>
        </div>
      </header>

      <div className={styles.filtersGlass}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            type="text"
            placeholder="搜索货品编码、名称或品类关键词..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        
        <div className={styles.categoryScroller}>
          <button
            className={`${styles.tabBtn} ${selectedCategory === '全部' ? styles.tabActive : ''}`}
            onClick={() => {
              setSelectedCategory('全部');
              setPage(1);
            }}
          >
            全部资产
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

      {loading ? (
        <div className={styles.loadingWrapper}>
          <div className={styles.loader}></div>
          <p>正在同步资产档案数据库...</p>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>暂无资产匹配</h3>
          <p>未能找到相关货品记录，建议调整搜索词或切换品类。也可以尝试批量导入数据。</p>
          <Link href="/products/import" className={styles.primaryBtn}>
            批量导入数据
          </Link>
        </div>
      ) : (
        <div className={styles.mainGridWrapper}>
          <div className={styles.premiumGrid}>
            {products.map(product => (
              <div key={product.id} className={styles.pCardWrapper}>
                <input
                  type="checkbox"
                  className={styles.selectCheckbox}
                  checked={selectedIds.has(product.id)}
                  onChange={(e) => toggleSelect(product.id)}
                />
                <Link
                  href={`/products/${product.id}`}
                  className={styles.pCard}
                >
                  <div className={styles.visualContainer}>
                    {product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        className={styles.pImg}
                        width={300}
                        height={300}
                        priority={page === 1}
                      />
                    ) : (
                      <div className={styles.pNoImg}>
                        <span>{product.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className={styles.floatTags}>
                      <span className={`${styles.statusDot} ${product.currentStock > 10 ? styles.statusNormal : product.currentStock > 0 ? styles.statusWarning : styles.statusEmpty}`}></span>
                    </div>
                  </div>
                  
                  <div className={styles.pContent}>
                    <div className={styles.pHeader}>
                      <span className={styles.pCode}>{product.code}</span>
                      <span className={styles.pCategory}>{product.category}</span>
                    </div>
                    <h3 className={styles.pTitle}>{product.name}</h3>
                    <div className={styles.pFooter}>
                      <span className={styles.stockLabel}>当前在库</span>
                      <div className={`${styles.stockValue} ${product.currentStock <= 5 ? styles.lowStock : ''}`}>
                        {product.currentStock} <span className={styles.unit}>件</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
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
                   第 <span className={styles.current}>{page}</span> 页 / 共 {totalPages} 页
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
              <span className={styles.countText}>已选中 <span className={styles.countNum}>{selectedIds.size}</span> 项资产</span>
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
        isOpen={showDeleteConfirm}
        title="确认批量删除"
        message={`确定要彻底删除选中的 ${selectedIds.size} 个货品档案吗？该操作不可撤销，且会清除相关的流水记录。`}
        confirmText="确认删除"
        type="danger"
        onConfirm={handleBatchDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
