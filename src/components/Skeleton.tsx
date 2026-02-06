import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'default' | 'circle' | 'glass';
  style?: React.CSSProperties;
}

export default function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  variant = 'default',
  style,
}: SkeletonProps) {
  const stylesObj: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: variant === 'circle' ? '50%' : borderRadius,
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${variant === 'glass' ? styles.glass : ''} ${className}`}
      style={stylesObj}
    />
  );
}
