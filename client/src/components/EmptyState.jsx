export default function EmptyState({
  title = "Nothing here yet",
  message = "No data found",
}) {
  return (
    <div className="empty-panel detail-card">
      <div style={{ display: 'grid', gap: '0.8rem', justifyItems: 'center', padding: '2rem 1rem' }}>
        <span className="pill">DriveEase</span>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p className="muted-line" style={{ margin: 0 }}>{message}</p>
      </div>
    </div>
  );
}
