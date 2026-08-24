import { useMemo, useState } from 'react';

const DEFAULT_SIZE = 210;
const DEFAULT_STROKE = 28;

function formatPercent(value) {
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export default function DonutChart({ title, subtitle, data = [], size = DEFAULT_SIZE, strokeWidth = DEFAULT_STROKE }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const chart = useMemo(() => {
    const cleanData = data.map((item) => ({
      ...item,
      value: Math.max(0, Number(item.value) || 0),
    }));
    const total = cleanData.reduce((sum, item) => sum + item.value, 0);
    const radius = Math.max(1, (size - strokeWidth) / 2);
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const segments = cleanData.filter((item) => item.value > 0).map((item) => {
      const percentage = total ? (item.value / total) * 100 : 0;
      const length = total ? (item.value / total) * circumference : 0;
      const segment = { ...item, percentage, length, offset };
      offset += length;
      return segment;
    });
    return { cleanData, total, radius, circumference, segments };
  }, [data, size, strokeWidth]);

  const active = activeIndex === null ? null : chart.segments[activeIndex];
  const centre = size / 2;
  const empty = chart.total === 0;

  return (
    <article className="donut-card">
      {(title || subtitle) && <header className="donut-header">
        {title && <h2>{title}</h2>}
        {subtitle && <p>{subtitle}</p>}
      </header>}
      <div className="donut-content">
        <div className="donut-visual" style={{ width: size, maxWidth: '100%' }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="donut-svg" aria-label={title || 'Gráfico de rosca'}>
            <circle cx={centre} cy={centre} r={chart.radius} fill="none" stroke="#e8edf4" strokeWidth={strokeWidth} />
            {!empty && chart.segments.map((segment, index) => (
              <circle
                key={`${segment.label}-${index}`}
                className="donut-segment"
                cx={centre}
                cy={centre}
                r={chart.radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.length} ${chart.circumference}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
                pathLength={chart.circumference}
                role="img"
                tabIndex="0"
                aria-label={`${segment.label}: ${segment.value} registos (${formatPercent(segment.percentage)}%)`}
                style={{ '--donut-dash': segment.length, '--donut-circumference': chart.circumference }}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex((current) => current === index ? null : index)}
              />
            ))}
            <text x={centre} y={centre - 2} textAnchor="middle" className="donut-total">{chart.total}</text>
            <text x={centre} y={centre + 21} textAnchor="middle" className="donut-total-label">{empty ? 'Sem dados' : 'Total'}</text>
          </svg>
          {active && <div className="donut-tooltip" role="status">
            <strong>{active.label}</strong>
            <span>{active.value} registos</span>
            <span>{formatPercent(active.percentage)}%</span>
          </div>}
        </div>
        <div className="donut-legend" aria-label="Legenda do gráfico">
          {empty ? <p className="donut-empty">Sem dados disponíveis.</p> : chart.cleanData.map((item, index) => {
            const percentage = chart.total ? (item.value / chart.total) * 100 : 0;
            return <div className="donut-legend-item" key={`${item.label}-${index}`}>
              <span className="donut-dot" style={{ background: item.color }} />
              <span className="donut-legend-label">{item.label}</span>
              <strong>{item.value} <small>({formatPercent(percentage)}%)</small></strong>
            </div>;
          })}
        </div>
      </div>
    </article>
  );
}
