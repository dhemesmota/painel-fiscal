export default function Loading() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="skeleton" style={{ width: 170, height: 34, borderRadius: 999, alignSelf: 'center' }} />
      <div className="skeleton" style={{ width: '40%', height: 12 }} />
      <div className="skeleton" style={{ width: '65%', height: 30 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <div className="skeleton" style={{ width: '100%', height: 46, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 46, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: '100%', height: 46, borderRadius: 12 }} />
      </div>
    </div>
  );
}
