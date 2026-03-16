type LineChartPoint = {
  label: string;
  value: number;
  note?: string;
};

type LineChartCardProps = {
  eyebrow: string;
  title: string;
  meta?: string;
  ariaLabel: string;
  accent?: "primary" | "secondary";
  points: LineChartPoint[];
  valueFormatter?: (value: number) => string;
};

const defaultValueFormatter = new Intl.NumberFormat("en-US").format;

export function LineChartCard({
  eyebrow,
  title,
  meta,
  ariaLabel,
  accent = "primary",
  points,
  valueFormatter = defaultValueFormatter,
}: LineChartCardProps) {
  const normalizedPoints = points.length > 0 ? points : [{ label: "n/a", value: 0 }];
  const maxValue = Math.max(...normalizedPoints.map((point) => point.value), 1);
  const minValue = Math.min(...normalizedPoints.map((point) => point.value), 0);
  const range = Math.max(maxValue - minValue, 1);
  const width = 640;
  const height = 240;
  const innerWidth = width - 48;
  const innerHeight = height - 44;
  const series = normalizedPoints.map((point, index) => {
    const x =
      24 +
      (normalizedPoints.length === 1
        ? innerWidth / 2
        : (index / (normalizedPoints.length - 1)) * innerWidth);
    const y = 18 + innerHeight - ((point.value - minValue) / range) * innerHeight;
    return { ...point, x, y };
  });
  const polyline = series.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `24,${height - 26} ${polyline} ${width - 24},${height - 26}`;
  const latest = normalizedPoints.at(-1) ?? null;
  const previous = normalizedPoints.at(-2) ?? null;
  const delta = latest && previous ? latest.value - previous.value : null;

  return (
    <article className={`line-chart-card line-chart-card-${accent}`}>
      <div className="line-chart-card-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        {meta ? <p className="panel-meta">{meta}</p> : null}
      </div>

      <div className="line-chart-summary">
        <div>
          <span className="line-chart-summary-label">Latest</span>
          <strong>{latest ? valueFormatter(latest.value) : "n/a"}</strong>
        </div>
        <div>
          <span className="line-chart-summary-label">Change</span>
          <strong>
            {delta === null ? "n/a" : `${delta > 0 ? "+" : ""}${valueFormatter(delta)}`}
          </strong>
        </div>
      </div>

      <div className="line-chart-shell" role="img" aria-label={ariaLabel}>
        <svg viewBox={`0 0 ${width} ${height}`} className="line-chart-svg" preserveAspectRatio="none">
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = 18 + innerHeight * ratio;
            return (
              <line
                key={ratio}
                x1="24"
                x2={width - 24}
                y1={y}
                y2={y}
                className="line-chart-gridline"
              />
            );
          })}
          <polygon points={area} className="line-chart-area" />
          <polyline points={polyline} className="line-chart-polyline" />
          {series.map((point) => (
            <circle key={point.label} cx={point.x} cy={point.y} r="4.5" className="line-chart-dot" />
          ))}
        </svg>
      </div>

      <div className="line-chart-footer">
        {normalizedPoints.map((point) => (
          <div key={point.label} className="line-chart-footer-item">
            <span>{point.label}</span>
            <strong>{valueFormatter(point.value)}</strong>
            {point.note ? <small>{point.note}</small> : null}
          </div>
        ))}
      </div>
    </article>
  );
}
