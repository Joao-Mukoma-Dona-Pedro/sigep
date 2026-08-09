function StatCard({ label, value, icon, tone = 'blue' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i className={`bi ${icon}`} aria-hidden="true" />
    </article>
  );
}

export default StatCard;
