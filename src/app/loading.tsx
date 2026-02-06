export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      minHeight: '400px',
      color: 'var(--color-primary)',
    }}>
      <div className="loadingSpinner" />
    </div>
  );
}
