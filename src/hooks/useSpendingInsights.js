import { useMemo, useState } from 'react';
import {
  filterExpensesByDateRange,
  getCategorySpending,
  getDateRange,
  getPreviousPeriodRange,
  getSpendingComparison,
  getSpendingMetrics,
  getTimeSeriesData,
} from '../utils/expenseCalculations.js';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range' },
];

function normalizeCustomRange(startValue, endValue) {
  const start = startValue ? new Date(`${startValue}T00:00:00`) : null;
  const end = endValue ? new Date(`${endValue}T00:00:00`) : null;

  if (!start || !end) {
    return { start: start ?? end, end: end ?? start };
  }

  return start <= end ? { start, end } : { start: end, end: start };
}

/**
 * Manages insights filters and derives all chart-ready data from app state.
 * The returned values are recalculated whenever expenses, categories, or filters change.
 */
export function useSpendingInsights(categories = [], expenses = []) {
  const [period, setPeriod] = useState('30d');
  const [customStart, setCustomStart] = useState(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return start.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() =>
    categories.map((category) => category.id)
  );
  const [today] = useState(() => new Date());

  const availableCategoryIds = useMemo(
    () => new Set(categories.map((category) => category.id)),
    [categories]
  );
  const activeCategoryIds = useMemo(
    () => selectedCategoryIds.filter((categoryId) => availableCategoryIds.has(categoryId)),
    [availableCategoryIds, selectedCategoryIds]
  );
  const customRange = useMemo(
    () => normalizeCustomRange(customStart, customEnd),
    [customEnd, customStart]
  );

  const dateRange = useMemo(() => {
    if (period === 'custom') {
      const safeRange = normalizeCustomRange(customStart, customEnd);
      return safeRange.start && safeRange.end
        ? { start: safeRange.start, end: safeRange.end }
        : getDateRange('30d', today, expenses);
    }
    return getDateRange(period, today, expenses);
  }, [customEnd, customStart, expenses, period, today]);
  const filteredExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, dateRange),
    [dateRange, expenses]
  );
  const categorySpending = useMemo(
    () => getCategorySpending(expenses, categories, activeCategoryIds, dateRange),
    [activeCategoryIds, categories, dateRange, expenses]
  );
  const timeSeries = useMemo(
    () => getTimeSeriesData(expenses, categories, activeCategoryIds, dateRange, period),
    [activeCategoryIds, categories, dateRange, expenses, period]
  );
  const metrics = useMemo(
    () => getSpendingMetrics(timeSeries, categorySpending),
    [categorySpending, timeSeries]
  );

  const previousDateRange = useMemo(
    () => getPreviousPeriodRange(dateRange, period),
    [dateRange, period]
  );
  const previousTimeSeries = useMemo(
    () =>
      previousDateRange
        ? getTimeSeriesData(expenses, categories, activeCategoryIds, previousDateRange, period)
        : null,
    [activeCategoryIds, categories, expenses, period, previousDateRange]
  );
  const comparison = useMemo(
    () =>
      previousTimeSeries
        ? getSpendingComparison(metrics.total, previousTimeSeries.total)
        : null,
    [metrics.total, previousTimeSeries]
  );

  function selectAllCategories() {
    setSelectedCategoryIds(categories.map((category) => category.id));
  }

  function clearAllCategories() {
    setSelectedCategoryIds([]);
  }

  function toggleCategory(categoryId) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  return {
    period,
    setPeriod,
    periodOptions: PERIOD_OPTIONS,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    selectedCategoryIds: activeCategoryIds,
    setSelectedCategoryIds,
    toggleCategory,
    selectAllCategories,
    clearAllCategories,
    dateRange,
    filteredExpenses,
    categorySpending,
    timeSeries,
    metrics,
    previousTimeSeries,
    comparison,
    hasSelectedCategories: activeCategoryIds.length > 0,
    hasExpenses: filteredExpenses.length > 0,
  };
}
