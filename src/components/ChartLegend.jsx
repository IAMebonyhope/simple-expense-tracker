function ChartLegend({ series, showTotal = false }) {
  return (
    <ul className="chart-legend" aria-label="Chart legend">
      {series.map((item, index) => (
        <li key={item.id} className="chart-legend__item">
          <span
            className={`chart-legend__swatch chart-legend__swatch--${index % 6}`}
            aria-hidden="true"
          />
          <span>{item.icon} {item.name}</span>
        </li>
      ))}
      {showTotal ? (
        <li className="chart-legend__item">
          <span className="chart-legend__swatch chart-legend__swatch--total" aria-hidden="true" />
          <span>Total spending</span>
        </li>
      ) : null}
    </ul>
  );
}

export default ChartLegend;
