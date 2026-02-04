'use client';

import { useState, useEffect } from 'react';
import styles from './CategorySelector.module.css';

interface Category {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  children?: Category[];
}

interface CategorySelectorProps {
  value?: string; // categoryId
  onChange: (categoryId: string | null, categoryPath?: string) => void;
  disabled?: boolean;
}

export default function CategorySelector({ value, onChange, disabled }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [level1Categories, setLevel1Categories] = useState<Category[]>([]);
  const [level2Categories, setLevel2Categories] = useState<Category[]>([]);
  const [level3Categories, setLevel3Categories] = useState<Category[]>([]);
  
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [selectedLevel3, setSelectedLevel3] = useState('');
  
  const [loading, setLoading] = useState(true);

  // 加载所有分类（扁平化）
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?format=flat');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        setLevel1Categories(data.data.filter((c: Category) => c.level === 1));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根据 value 初始化选中状态
  useEffect(() => {
    if (value && categories.length > 0) {
      const selected = categories.find(c => c.id === value);
      if (selected) {
        if (selected.level === 1) {
          setSelectedLevel1(selected.id);
        } else if (selected.level === 2) {
          setSelectedLevel1(selected.parentId || '');
          setSelectedLevel2(selected.id);
        } else if (selected.level === 3) {
          const parent = categories.find(c => c.id === selected.parentId);
          if (parent) {
            setSelectedLevel1(parent.parentId || '');
            setSelectedLevel2(parent.id);
            setSelectedLevel3(selected.id);
          }
        }
      }
    }
  }, [value, categories]);

  // 更新二级分类选项
  useEffect(() => {
    if (selectedLevel1) {
      const children = categories.filter(c => c.level === 2 && c.parentId === selectedLevel1);
      setLevel2Categories(children);
    } else {
      setLevel2Categories([]);
      setSelectedLevel2('');
    }
  }, [selectedLevel1, categories]);

  // 更新三级分类选项
  useEffect(() => {
    if (selectedLevel2) {
      const children = categories.filter(c => c.level === 3 && c.parentId === selectedLevel2);
      setLevel3Categories(children);
    } else {
      setLevel3Categories([]);
      setSelectedLevel3('');
    }
  }, [selectedLevel2, categories]);

  // 通知父组件变化
  useEffect(() => {
    const selectedId = selectedLevel3 || selectedLevel2 || selectedLevel1 || null;
    if (selectedId) {
      const category = categories.find(c => c.id === selectedId);
      const path = getCategoryPath(selectedId);
      onChange(selectedId, path);
    } else {
      onChange(null);
    }
  }, [selectedLevel1, selectedLevel2, selectedLevel3]);

  const getCategoryPath = (categoryId: string): string => {
    const parts: string[] = [];
    let current = categories.find(c => c.id === categoryId);
    
    while (current) {
      parts.unshift(current.name);
      if (current.parentId) {
        current = categories.find(c => c.id === current!.parentId);
      } else {
        break;
      }
    }
    
    return parts.join(' > ');
  };

  const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel1(value);
    setSelectedLevel2('');
    setSelectedLevel3('');
  };

  const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel2(value);
    setSelectedLevel3('');
  };

  const handleLevel3Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel3(e.target.value);
  };

  if (loading) {
    return <div className={styles.loading}>加载分类中...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.cascadeWrapper}>
        {/* 一级分类 */}
        <select
          className={styles.select}
          value={selectedLevel1}
          onChange={handleLevel1Change}
          disabled={disabled}
        >
          <option value="">选择一级分类</option>
          {level1Categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* 二级分类 */}
        {selectedLevel1 && (
          <>
            <div className={styles.arrow}>→</div>
            <select
              className={styles.select}
              value={selectedLevel2}
              onChange={handleLevel2Change}
              disabled={disabled || level2Categories.length === 0}
            >
              <option value="">选择二级分类（可选）</option>
              {level2Categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </>
        )}

        {/* 三级分类 */}
        {selectedLevel2 && (
          <>
            <div className={styles.arrow}>→</div>
            <select
              className={styles.select}
              value={selectedLevel3}
              onChange={handleLevel3Change}
              disabled={disabled || level3Categories.length === 0}
            >
              <option value="">选择三级分类（可选）</option>
              {level3Categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* 显示完整路径 */}
      {(selectedLevel1 || selectedLevel2 || selectedLevel3) && (
        <div className={styles.pathDisplay}>
          {getCategoryPath(selectedLevel3 || selectedLevel2 || selectedLevel1)}
        </div>
      )}
    </div>
  );
}
