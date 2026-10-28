/**
 * Pure helper functions for expense and budget math.
 * Components should use these instead of calculating totals inline.
 */
import { parseISODate } from './formatters.js';

/** Rounds a number to 2 decimal places to avoid floating point noise. */
export function roundToCents(value) {
  return Math.round(value * 100) / 100;
}

/** Sum of all category budgets. */
export function calculateTotalBudget(categories) {
  return roundToCents(categories.reduce((total, category) => total + Number(category.budget), 0));
}

/** Sum of all recorded expenses. Multiple expenses on the same date are included. */
export function calculateTotalExpenses(expenses) {
  return roundToCents(
    expenses.reduce((total, expense) => total + Number(expense.amount), 0)
  );
}

/** Total budget minus total expenses. May be negative. */
export function calculateRemainingBalance(categories, expenses) {
  return roundToCents(calculateTotalBudget(categories) - calculateTotalExpenses(expenses));
}

/** Sum of the expenses that belong to one category. */
export function calculateCategorySpent(expenses, categoryId) {
  return roundToCents(
    expenses
      .filter((expense) => expense.categoryId === categoryId)
      .reduce((total, expense) => total + Number(expense.amount), 0)
  );
}

/** Category budget minus what has been spent in it. May be negative. */
export function calculateCategoryRemaining(category, expenses) {
  return roundToCents(Number(category.budget) - calculateCategorySpent(expenses, category.id));
}

/**
 * Returns each category with its calculated `spent`, `remaining`
 * and `expenseCount` values. Does not modify the input.
 */
export function getCategorySummaries(categories, expenses) {
  return categories.map((category) => ({
    ...category,
    spent: calculateCategorySpent(expenses, category.id),
    remaining: calculateCategoryRemaining(category, expenses),
    expenseCount: expenses.filter((expense) => expense.categoryId === category.id).length,
  }));
}

/** Returns a new array sorted by date, newest first (or oldest first). */
export function sortExpensesByDate(expenses, order = 'newest') {
  const direction = order === 'oldest' ? 1 : -1;
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -direction : direction;
    if (a.id === b.id) return 0;
    return a.id < b.id ? -direction : direction;
  });
}

/**
 * Returns a new array grouped by category name (A–Z), newest first within
 * each category. Expenses with an unknown category go last.
 */
export function sortExpensesByCategory(expenses, categories) {
  const namesById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
  return sortExpensesByDate(expenses).sort((a, b) => {
    const nameA = namesById[a.categoryId];
    const nameB = namesById[b.categoryId];
    if (nameA === nameB) return 0;
    if (nameA === undefined) return 1;
    if (nameB === undefined) return -1;
    return nameA.localeCompare(nameB);
  });
}

const INSIGHTS_PERIOD_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function isValidExpense(expense) {
  return (
    expense &&
    typeof expense.date === 'string' &&
    parseISODate(expense.date) &&
    Number.isFinite(Number(expense.amount)) &&
    Number(expense.amount) >= 0
  );
}

function dateDifferenceInDays(start, end) {
  return Math.round((end - start) / 86400000);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the inclusive date range used by the insights filters. */
export function getDateRange(period, today = new Date(), expenses = []) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const validDates = expenses
    .filter(isValidExpense)
    .map((expense) => parseISODate(expense.date))
    .filter(Boolean);

  if (period === 'all') {
    const earliest = validDates.reduce(
      (oldest, date) => (date < oldest ? date : oldest),
      end
    );
    return { start: earliest, end };
  }

  const days = INSIGHTS_PERIOD_DAYS[period] ?? INSIGHTS_PERIOD_DAYS['30d'];
  return { start: addDays(end, -(days - 1)), end };
}

/** Returns valid expenses inside an inclusive date range without mutating input. */
export function filterExpensesByDateRange(expenses, dateRange) {
  if (!dateRange?.start || !dateRange?.end) return [];
  return expenses.filter((expense) => {
    if (!isValidExpense(expense)) return false;
    const date = parseISODate(expense.date);
    return date >= dateRange.start && date <= dateRange.end;
  });
}

/** Returns spending totals for selected categories, including zero-spend categories. */
export function getCategorySpending(
  expenses,
  categories,
  selectedCategoryIds = categories.map((category) => category.id),
  dateRange
) {
  const selected = new Set(selectedCategoryIds);
  const filteredExpenses = filterExpensesByDateRange(expenses, dateRange);
  const totals = new Map();

  for (const expense of filteredExpenses) {
    if (!selected.has(expense.categoryId)) continue;
    const current = totals.get(expense.categoryId) ?? { spent: 0, expenseCount: 0 };
    current.spent += Number(expense.amount);
    current.expenseCount += 1;
    totals.set(expense.categoryId, current);
  }

  const totalSpent = [...totals.values()].reduce((sum, item) => sum + item.spent, 0);
  return categories
    .filter((category) => selected.has(category.id))
    .map((category) => {
      const item = totals.get(category.id) ?? { spent: 0, expenseCount: 0 };
      return {
        ...category,
        spent: roundToCents(item.spent),
        expenseCount: item.expenseCount,
        percentage: totalSpent > 0 ? roundToCents((item.spent / totalSpent) * 100) : 0,
      };
    })
    .sort((a, b) => b.spent - a.spent || a.name.localeCompare(b.name));
}

/** Returns the start date for a daily, weekly, or monthly time bucket. */
export function getTimeBucketKey(value, granularity) {
  const date = typeof value === 'string' ? parseISODate(value) : value;
  if (!date) return null;
  const bucketStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (granularity === 'week') {
    const daysSinceMonday = (bucketStart.getDay() + 6) % 7;
    bucketStart.setDate(bucketStart.getDate() - daysSinceMonday);
  } else if (granularity === 'month') {
    bucketStart.setDate(1);
  }

  return dateKey(bucketStart);
}

function getBucketGranularity(period) {
  if (period === '90d') return 'week';
  if (period === 'all') return 'month';
  return 'day';
}

function getNextBucket(date, granularity) {
  if (granularity === 'week') return addDays(date, 7);
  if (granularity === 'month') return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return addDays(date, 1);
}

function getBucketEnd(date, granularity) {
  if (granularity === 'week') return addDays(date, 6);
  if (granularity === 'month') return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return date;
}

function getBucketStartForRange(dateRange, granularity) {
  const start = new Date(dateRange.start);
  if (granularity === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (granularity === 'month') {
    start.setDate(1);
  }
  return start;
}

/** Returns chronological, zero-filled spending buckets and category series. */
export function getTimeSeriesData(
  expenses,
  categories,
  selectedCategoryIds = categories.map((category) => category.id),
  dateRange,
  period = '30d'
) {
  if (!dateRange?.start || !dateRange?.end || selectedCategoryIds.length === 0) {
    return { granularity: getBucketGranularity(period), buckets: [], series: [], total: 0 };
  }

  const granularity = getBucketGranularity(period);
  const selected = categories.filter((category) => selectedCategoryIds.includes(category.id));
  const buckets = [];
  for (
    let start = getBucketStartForRange(dateRange, granularity);
    start <= dateRange.end;
    start = getNextBucket(start, granularity)
  ) {
    const key = dateKey(start);
    buckets.push({
      key,
      startDate: key,
      endDate: dateKey(getBucketEnd(start, granularity)),
      values: Object.fromEntries(selected.map((category) => [category.id, 0])),
      total: 0,
    });
  }

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const expense of filterExpensesByDateRange(expenses, dateRange)) {
    if (!selectedCategoryIds.includes(expense.categoryId)) continue;
    const bucket = bucketByKey.get(getTimeBucketKey(expense.date, granularity));
    if (!bucket) continue;
    const amount = Number(expense.amount);
    bucket.values[expense.categoryId] += amount;
    bucket.total += amount;
  }

  for (const bucket of buckets) {
    for (const category of selected) {
      bucket.values[category.id] = roundToCents(bucket.values[category.id]);
    }
    bucket.total = roundToCents(bucket.total);
  }

  return {
    granularity,
    buckets,
    series: selected.map((category) => ({
      ...category,
      values: buckets.map((bucket) => bucket.values[category.id]),
    })),
    total: roundToCents(buckets.reduce((sum, bucket) => sum + bucket.total, 0)),
  };
}

/** Calculates headline metrics from time-series data and category spending. */
export function getSpendingMetrics(timeSeries, categorySpending = []) {
  const buckets = timeSeries?.buckets ?? [];
  const total = roundToCents(timeSeries?.total ?? 0);
  const highestBucket = buckets.reduce(
    (highest, bucket) => (!highest || bucket.total > highest.total ? bucket : highest),
    null
  );
  return {
    total,
    averagePerBucket: buckets.length ? roundToCents(total / buckets.length) : 0,
    highestBucket,
    highestCategory: categorySpending[0] ?? null,
  };
}

/** Returns the equivalent preceding date range for a bounded period. */
export function getPreviousPeriodRange(dateRange, period) {
  if (!dateRange?.start || !dateRange?.end || period === 'all') return null;
  const days = dateDifferenceInDays(dateRange.start, dateRange.end) + 1;
  const end = addDays(dateRange.start, -1);
  return { start: addDays(end, -(days - 1)), end };
}

/** Compares current and previous totals, returning null when no comparison exists. */
export function getSpendingComparison(currentTotal, previousTotal, hasPreviousData = true) {
  if (!hasPreviousData || previousTotal === null || previousTotal === undefined) return null;
  const amountChange = roundToCents(currentTotal - previousTotal);
  return {
    amountChange,
    percentageChange: previousTotal === 0 ? null : roundToCents((amountChange / previousTotal) * 100),
  };
}
