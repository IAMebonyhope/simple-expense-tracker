import { formatCurrency } from '../utils/formatters.js';
import ChartDataTable from './ChartDataTable.jsx';

function CategorySpendingChart({ data }) {
  const width = 720;
  const rowHeight = 42;
  const chartHeight = Math.max(130, data.length * rowHeight + 20);
  const maxSpent = Math.max(...data.map((item) => item.spent), 1);
  const barWidth = width - 260;

  return (
    <section className="insights-card card" aria-labelledby="category-chart-heading">
      <h3 id="category-chart-heading" className="card__title">Spending by category</h3>
      {data.length === 0 ? (
        <p className="empty-state">Select at least one category to view category spending.</p>
      ) : (
        <>
          <p className="chart-summary">
            {data[0].spent > 0
              ? `${data[0].name} is the highest spending category at ${formatCurrency(data[0].spent)}, representing ${data[0].percentage}% of selected spending.`
              : 'No spending was recorded for the selected categories and period.'}
          </p>
          <div className="chart-scroll">
            <svg
              className="chart-svg category-chart"
              viewBox={`0 0 ${width} ${chartHeight}`}
              role="img"
              aria-labelledby="category-chart-heading category-chart-description"
            >
              <desc id="category-chart-description">
                Horizontal bars compare spending totals for each selected category.
              </desc>
              {data.map((item, index) => {
                const y = index * rowHeight + 8;
                const length = (item.spent / maxSpent) * barWidth;
                return (
                  <g key={item.id}>
                    <text className="chart-label" x="0" y={y + 18}>
                      {item.icon} {item.name}
                    </text>
                    <rect
                      className={`chart-bar chart-bar--${index % 6}`}
                      x="250"
                      y={y + 4}
                      width={length}
                      height="22"
                      rx="5"
                    />
                    <text className="chart-value" x="260" y={y + 20}>
                      {formatCurrency(item.spent)} ({item.percentage}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <ChartDataTable
            title="Spending by category"
            series={data}
            buckets={[{
              key: 'category-total',
              startDate: '2000-01-01',
              endDate: '2000-01-01',
              values: Object.fromEntries(data.map((item) => [item.id, item.spent])),
              total: data.reduce((sum, item) => sum + item.spent, 0),
            }]}
            includeTotal
          />
        </>
      )}
    </section>
  );
}

export default CategorySpendingChart;
