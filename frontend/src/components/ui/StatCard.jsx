function StatCard({ label, value, icon, tone = 'blue' }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      <div>
        <span>{label.replace('Total de ', '')}</span>
        <strong>{value}</strong>
        <small>Registos</small>
      </div>
    </article>
  );
}

export default StatCard;
