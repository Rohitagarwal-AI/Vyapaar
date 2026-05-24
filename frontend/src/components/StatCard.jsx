export default function StatCard({ label, value, helper, icon: Icon, tone = "blue" }) {
  return (
    <section className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{Icon ? <Icon size={22} /> : null}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {helper ? <span>{helper}</span> : null}
      </div>
    </section>
  );
}

