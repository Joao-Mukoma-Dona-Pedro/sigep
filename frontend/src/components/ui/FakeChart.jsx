function FakeChart({ title, bars }) {
  return (
    <article className="panel-card">
      <div className="panel-card-header">
        <h2>{title}</h2>
        <span className="badge sigep-badge badge-info">Demo</span>
      </div>
      <div className="fake-chart" aria-label={title}>
        {bars.map((bar) => (
          <div className="chart-row" key={bar.label}>
            <span>{bar.label}</span>
            <div className="chart-track">
              <div className={`chart-bar tone-${bar.tone || 'blue'}`} style={{ width: `${bar.value}%` }} />
            </div>
            <strong>{bar.value}%</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

export default FakeChart;
