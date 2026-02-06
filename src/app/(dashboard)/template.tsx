'use client';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-enter" style={{ width: '100%' }}>
      {children}
    </div>
  );
}
