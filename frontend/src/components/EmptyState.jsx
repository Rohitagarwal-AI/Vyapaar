export default function EmptyState({ title, message, children }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{message}</span>
      {children}
    </div>
  );
}
