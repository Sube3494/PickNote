'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastContext';
import styles from './page.module.css';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const backUrl = from === 'dashboard' ? '/' : '/products';
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(10); // Start progress
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Fake progress increment
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const res = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (data.success) {
        showToast(data.message || '导入成功', 'success');
        setMessage({ type: 'success', text: data.message });
        // Redirect after success
        setTimeout(() => {
          router.push(backUrl);
        }, 2000);
      } else {
        const errorMsg = data.message || '导入失败，请检查文件格式';
        showToast(errorMsg, 'error');
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch {
      setMessage({ type: 'error', text: '网络请求失败，请稍后重试' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href={backUrl} className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            返回货品信息
          </Link>
          <h1 className={styles.title}>批量导入货品</h1>
          <p className={styles.subtitle}>上传 Excel 文档，系统将自动识别条码、品类及嵌入图片</p>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.uploadCard}>
          <div 
            className={`${styles.dropZone} ${file ? styles.hasFile : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx, .xls"
              className={styles.hiddenInput}
            />
            
            <div className={styles.uploadIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            
            <div className={styles.uploadText}>
              {file ? (
                <>
                  <span className={styles.fileName}>{file.name}</span>
                  <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </>
              ) : (
                <>
                  <span className={styles.mainText}>点击或拖拽 Excel 文件至此</span>
                  <span className={styles.subText}>支持 .xlsx 标准格式，图片需嵌入在第二列</span>
                </>
              )}
            </div>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {message.type === 'success' ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </>
                )}
              </svg>
              {message.text}
            </div>
          )}

          <div className={styles.actions}>
            <button 
              className={`btn btn-primary ${styles.importBtn}`}
              disabled={!file || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                  正在深度同步数据...
                </span>
              ) : '立即启动智能导入'}
            </button>
            {file && !isUploading && (
              <button 
                className={`btn btn-secondary ${styles.resetBtn}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                重置
              </button>
            )}
          </div>

          {isUploading && (
            <div className={styles.progressWrapper}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
              </div>
              <span className={styles.progressText}>{progress}% 处理中</span>
            </div>
          )}
        </div>

        <section className={styles.guide}>
          <h3 className={styles.guideTitle}>导入注意事项</h3>
          <ul className={styles.guideList}>
             <li>1. <b>规范纠错</b>：系统会自动处理 <b>B3 -&gt; B03</b> 这种货品编码不规范问题。</li>
             <li>2. <b>品类智能识别</b>：系统将根据名称关键词（如“茶叶”、“盲盒”）自动归类。</li>
             <li>3. <b>图片嵌入规范</b>：图片需通过 Excel 的“嵌入到单元格”方式插入，且位于 <b>B 列</b>。</li>
             <li>4. <b>增量/覆盖更新</b>：如果编码已存在，系统将更新商品资料而不会新建重复记录。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
