import { useSpendingInsights } from '../hooks/useSpendingInsights.js';
import { formatCurrency } from '../utils/formatters.js';
import CategorySpendingChart from './CategorySpendingChart.jsx';
import SpendingTrendChart from './SpendingTrendChart.jsx';

function SpendingInsights({ categories, expenses }) {
  const insights = useSpendingInsights(categories, expenses);
  const status = insights.hasSelectedCategories
    ? `Showing ${insights.periodOptions.find((option) => option.value === insights.period)?.label.toLowerCase()} spending for ${insights.selectedCategoryIds.length} categories.`
    : 'No categories selected.';

  return (
    <section className="section" aria-labelledby="insights-heading">
      <h2 id="insights-heading" className="section__title">Spending Insights</h2>
      <div className="insights-controls card">
        <div className="insights-control">
          <label htmlFor="insights-period">Time period</label>
          <select
            id="insights-period"
            value={insights.period}
            onChange={(event) => insights.setPeriod(event.target.value)}
          >
            {insights.periodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        {insights.period === 'custom' ? (
          <div className="insights-custom-range">
            <div className="insights-control">
              <label htmlFor="insights-start-date">From</label>
              <input
                id="insights-start-date"
                type="date"
                value={insights.customStart}
                onChange={(event) => insights.setCustomStart(event.target.value)}
              />
            </div>
            <div className="insights-control">
              <label htmlFor="insights-end-date">To</label>
              <input
                id="insights-end-date"
                type="date"
                value={insights.customEnd}
                onChange={(event) => insights.setCustomEnd(event.target.value)}
              />
            </div>
          </div>
        ) : null}
        <fieldset className="category-selector">
          <legend>Categories to compare</legend>
          <div className="category-selector__actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={insights.selectAllCategories}>
              Select all
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={insights.clearAllCategories}>
              Clear all
            </button>
          </div>
          <div className="category-selector__options">
            {categories.map((category) => (
              <label key={category.id} className="category-selector__option">
                <input
                  type="checkbox"
                  checked={insights.selectedCategoryIds.includes(category.id)}
                  onChange={() => insights.toggleCategory(category.id)}
                />
                <span aria-hidden="true">{category.icon}</span>
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="insights-status" role="status" aria-live="polite">{status}</p>
      </div>

      {insights.hasSelectedCategories && !insights.hasExpenses ? (
        <p className="insights-empty card">
          No valid expenses found for the selected period and categories. Change the filters or add an expense.
        </p>
      ) : null}
      {insights.hasSelectedCategories ? (
        <div className="insights-grid">
          <CategorySpendingChart data={insights.categorySpending} />
          <SpendingTrendChart data={insights.timeSeries} metrics={insights.metrics} />
        </div>
      ) : (
        <p className="insights-empty card">
          Select at least one category to compare spending patterns.
        </p>
      )}
      {insights.comparison ? (
        <p className="insights-comparison">
          Compared with the previous period: {formatCurrency(Math.abs(insights.comparison.amountChange))}{' '}
          {insights.comparison.amountChange >= 0 ? 'more' : 'less'} spent.
          {insights.comparison.percentageChange === null
            ? ''
            : ` (${Math.abs(insights.comparison.percentageChange)}%).`}
        </p>
      ) : null}
    </section>
  );
}

export default SpendingInsights;
