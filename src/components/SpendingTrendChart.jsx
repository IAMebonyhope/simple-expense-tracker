import { formatCurrency, formatDate } from '../utils/formatters.js';
import ChartDataTable from './ChartDataTable.jsx';
import ChartLegend from './ChartLegend.jsx';

const COLORS = ['#4f46e5', '#0d9488', '#b45309', '#c0262d', '#7c3aed', '#2563eb'];
const DASHES = ['0', '8 4', '3 3', '12 4 2 4', '2 6', '16 4'];

function SpendingTrendChart({ data, metrics }) {
  const width = 720;
  const height = 320;
  const padding = { top: 24, right: 24, bottom: 70, left: 76 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.buckets.map((bucket) => bucket.total), 1);
  const x = (index) => padding.left + (data.buckets.length <= 1
    ? plotWidth / 2
    : (index / Math.max(1, data.buckets.length - 1)) * plotWidth);
  const y = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const showTotal = data.series.length > 1;
  const tickValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => maxValue * fraction);

  function linePath(values) {
    return values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ');
  }

  return (
    <section className="insights-card card" aria-labelledby="trend-chart-heading">
      <h3 id="trend-chart-heading" className="card__title">Spending over time</h3>
      {data.buckets.length === 0 ? (
        <p className="empty-state">Select at least one category to view spending trends.</p>
      ) : (
        <>
          <p id="trend-chart-description" className="chart-summary">
            Total spending is {formatCurrency(metrics.total)}. Average per bucket is{' '}
            {formatCurrency(metrics.averagePerBucket)}.
            {metrics.highestBucket
              ? ` Highest spending was ${formatCurrency(metrics.highestBucket.total)} from ${formatDate(metrics.highestBucket.startDate)}.`
              : ''}
          </p>
          <ChartLegend series={data.series} showTotal={showTotal} />
          <div className="chart-scroll">
            <svg
              className="chart-svg trend-chart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-labelledby="trend-chart-heading trend-chart-description"
            >
              <desc>Line chart showing spending for each selected category over time.</desc>
              {tickValues.map((value, index) => (
                <g key={`${value}-${index}`}>
                  <line
                    className="chart-gridline"
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y(value)}
                    y2={y(value)}
                  />
                  <text className="chart-axis-label chart-axis-label--y" x={padding.left - 10} y={y(value) + 4} textAnchor="end">
                    {formatCurrency(value)}
                  </text>
                </g>
              ))}
              {data.buckets.map((bucket, index) => {
                const shouldShowLabel = data.buckets.length <= 8 || index % Math.ceil(data.buckets.length / 6) === 0 || index === data.buckets.length - 1;
                return (
                  <text
                    key={bucket.key}
                    className="chart-axis-label chart-axis-label--x"
                    x={x(index)}
                    y={height - 20}
                    textAnchor={index === 0 ? 'start' : index === data.buckets.length - 1 ? 'end' : 'middle'}
                    opacity={shouldShowLabel ? 1 : 0.72}
                  >
                    {shouldShowLabel ? formatDate(bucket.startDate) : ''}
                  </text>
                );
              })}
              {data.series.map((series, index) => (
                <g key={series.id}>
                  <path
                    className="chart-line"
                    d={linePath(series.values)}
                    stroke={COLORS[index % COLORS.length]}
                    strokeDasharray={DASHES[index % DASHES.length]}
                  />
                  {series.values.map((value, pointIndex) => (
                    <circle
                      key={`${series.id}-${data.buckets[pointIndex].key}`}
                      className="chart-point"
                      cx={x(pointIndex)}
                      cy={y(value)}
                      r="4"
                      fill={COLORS[index % COLORS.length]}
                    >
                      <title>{`${series.name}, ${formatDate(data.buckets[pointIndex].startDate)}: ${formatCurrency(value)}`}</title>
                    </circle>
                  ))}
                </g>
              ))}
              {showTotal ? (
                <path
                  className="chart-line chart-line--total"
                  d={linePath(data.buckets.map((bucket) => bucket.total))}
                  stroke="#1b2333"
                  strokeDasharray="4 4"
                />
              ) : null}
            </svg>
          </div>
          <ChartDataTable
            title="Spending over time"
            series={data.series}
            buckets={data.buckets}
            includeTotal={showTotal}
          />
        </>
      )}
    </section>
  );
}

export default SpendingTrendChart;
