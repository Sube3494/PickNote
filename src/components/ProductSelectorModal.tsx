'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ProductSelectorModal.module.css';

interface Product {
  id: string;
  name: string;
  code: string | null;
  images: string;
  category: string;
  currentStock: number;
  price: number;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (products: Product[]) => void;
  excludeIds?: string[];
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
}: ProductSelectorModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts(search);
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchProducts(search);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const fetchProducts = async (query: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?limit=100&search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        // Filter out products already in the purchase list
        const filtered = data.data.filter((p: Product) => !excludeIds.includes(p.id));
        setProducts(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products;

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>选择进货货品</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div className={styles.searchWrapper}>
          <div className={styles.searchField}>
            <div className={styles.searchIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              className={styles.searchInput}
              placeholder="搜索货品名称或编码..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.emptyState}>正在加载货品数据...</div>
          ) : filteredProducts.length > 0 ? (
            <div className={styles.productList}>
              {filteredProducts.map(product => {
                let imageUrl = '';
                try {
                  const imageArray = JSON.parse(product.images || '[]');
                  imageUrl = imageArray.length > 0 ? imageArray[0] : '';
                } catch {
                  imageUrl = '';
                }

                return (
                  <div 
                    key={product.id} 
                    className={`${styles.productItem} ${selectedIds.has(product.id) ? styles.selected : ''}`}
                    onClick={() => toggleSelect(product.id)}
                  >
                    <div className={styles.imgWrapper}>
                      {imageUrl ? (
                        <Image src={imageUrl} alt={product.name} width={54} height={54} className={styles.productImg} />
                      ) : (
                        <span className={styles.placeholderImg}>📦</span>
                      )}
                    </div>
                    <div className={styles.info}>
                      <div className={styles.name}>{product.name}</div>
                      <div className={styles.meta}>
                        <span className={styles.badge}>{product.category}</span>
                        {product.code && <span>#{product.code}</span>}
                        <span>库存: {product.currentStock}</span>
                      </div>
                    </div>
                    {selectedIds.has(product.id) && (
                      <div className={styles.checkIcon}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>暂无匹配货品</p>
              <p style={{ fontSize: '0.875rem' }}>尝试更换搜索关键词</p>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button 
            className={styles.confirmBtn} 
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
          >
            确认添加 ({selectedIds.size})
          </button>
        </footer>
      </div>
    </div>
  );
}
