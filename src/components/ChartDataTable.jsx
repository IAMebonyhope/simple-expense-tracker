import { formatCurrency, formatDate } from '../utils/formatters.js';

function ChartDataTable({ title, series, buckets, includeTotal = false }) {
  if (!buckets.length) return null;

  return (
    <details className="chart-data">
      <summary>Show {title.toLowerCase()} data table</summary>
      <div className="chart-data__scroll">
        <table className="data-table chart-data__table">
          <caption className="visually-hidden">{title} data</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              {series.map((item) => (
                <th scope="col" key={item.id}>{item.name}</th>
              ))}
              {includeTotal ? <th scope="col">Total</th> : null}
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr key={bucket.key}>
                <th scope="row">
                  {bucket.startDate === bucket.endDate
                    ? formatDate(bucket.startDate)
                    : `${formatDate(bucket.startDate)} – ${formatDate(bucket.endDate)}`}
                </th>
                {series.map((item) => (
                  <td key={item.id}>{formatCurrency(bucket.values[item.id] ?? 0)}</td>
                ))}
                {includeTotal ? <td>{formatCurrency(bucket.total)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default ChartDataTable;
