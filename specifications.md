# Spending Insights Specification

## 1. Overview

Add a **Spending Insights** section to ExpenseFlow so users can understand where
their money goes and how spending changes over time. The feature must use the
existing `expenses` and `categories` state passed from `App.jsx`; it must not
introduce a second source of truth or require a backend.

The feature should be useful with the existing sample data and with an empty,
partially populated, or locally saved dataset.

## 2. Goals

- Show spending totals by category.
- Show spending trends over selectable time periods.
- Allow multiple categories to be compared in the same trend chart.
- Recalculate chart data and summary metrics whenever filters or expense data
  change.
- Prevent misleading, broken, or inaccessible charts.
- Preserve the existing local-storage behavior and Nigerian Naira formatting.

## 3. User experience

### 3.1 Placement

Add a `Spending Insights` section to the main page, directly after the
dashboard and before category budgets. The section should contain:

1. Filter controls.
2. A category spending chart.
3. A spending-over-time chart.
4. Text summaries and an accessible data representation for both charts.

The existing dashboard breakdown remains unchanged; the insights section adds
interactive analysis rather than replacing current totals.

### 3.2 Filters

Provide:

- **Time period**: `Last 7 days`, `Last 30 days`, `Last 90 days`, and
  `All time`.
- **Categories**: a multi-select control or a group of checkboxes containing
  every configured category.
- **Select all** and **Clear all** actions for categories.

The default period is `Last 30 days`. All categories should be selected by
default. If no categories are selected, the charts must show an explicit empty
state rather than silently displaying all categories.

The selected filters are view state only and do not need to be persisted to
`localStorage`.

## 4. Charts and metrics

### 4.1 Spending by category

Show a horizontal bar chart because category names can be long and the chart
must remain readable on small screens.

For each selected category, display:

- Category name and icon.
- Total spending in the selected period, formatted as Naira.
- Number of transactions.
- Percentage of the filtered spending total.

Sort bars by spending from highest to lowest. Categories with zero spending
remain visible when selected, so users can distinguish “no spending” from a
missing category.

The chart must include a concise textual summary, for example:

> Food & Dining is the highest spending category at ₦85,498.98, representing
> 51% of the selected spending.

If the filtered period contains no expenses, show a no-data state with the
selected period and categories named in text.

### 4.2 Spending over time

Show a line chart with:

- X-axis: calendar dates or period buckets.
- Y-axis: total spending in Naira.
- One series for each selected category.
- A clearly labelled total series when more than one category is selected.

Bucket granularity must adapt to the selected period:

| Period | Bucket |
| --- | --- |
| Last 7 days | Day |
| Last 30 days | Day |
| Last 90 days | Week |
| All time | Month |

Include buckets with zero spending so the line does not imply that missing
dates were not part of the selected range. Dates must be ordered
chronologically.

The chart must provide:

- Total spending for the selected period.
- Average spending per bucket.
- Highest-spend bucket and its amount.
- A comparison of each selected category with the previous equivalent period
  when enough data exists. If comparison data does not exist, show
  “No previous-period comparison available.”

### 4.3 Dynamic category comparison

Changing the category selection must update, without a page reload:

- The category chart bars and percentages.
- The time-series lines and legend.
- The total series.
- Summary metrics.
- The accessible table/data view.

The chart must support comparing at least six categories at once, matching the
current default category set. A selected category must have a distinguishable
line pattern, marker, or stroke style in addition to its color. The legend
must identify each series by category name and icon.

## 5. Data and calculation rules

### 5.1 Source data

Use the existing expense shape:

```js
{
  id: string,
  description: string,
  amount: number,
  categoryId: string,
  date: 'YYYY-MM-DD'
}
```

Use category metadata from the existing category shape:

```js
{
  id: string,
  name: string,
  icon: string,
  budget: number
}
```

Chart calculations should be implemented as pure helpers in
`src/utils/expenseCalculations.js` or a focused adjacent utility module. They
must return new arrays and must not mutate expenses or categories.

### 5.2 Filtering

- Include an expense when its date falls within the selected inclusive date
  range.
- Use local calendar dates consistently with the existing `parseISODate` and
  `toISODate` helpers.
- Match expenses by `categoryId`.
- Unknown category IDs must not crash rendering. They should be excluded from
  category-specific chart series and reported in a non-blocking data warning
  or grouped as `Uncategorized`, according to the final UI decision.
- Amounts must be treated as finite numbers. Invalid amounts must not produce
  `NaN`, `Infinity`, or broken chart scales.
- Each expense record must be counted once by its record identity. Multiple
  expenses on the same date must all be included.
- Round displayed monetary values to two decimal places using the existing
  rounding/formatting conventions.

### 5.3 Empty and invalid states

The insights section must handle:

- No expenses.
- No categories.
- No selected categories.
- Selected categories with no matching expenses.
- Expenses outside the selected period.
- Unknown category IDs.
- Invalid dates or amounts in locally stored data.
- Very large amounts without overflowing or creating unreadable scales.

For no-data states, keep the controls available so the user can change the
period or categories. Do not render an empty SVG, misleading zero-only
visualization, or an unhandled exception.

## 6. Chart implementation requirements

- Prefer a semantic SVG implementation or a well-maintained chart library that
  works with the existing React/Vite setup.
- Do not add a dependency without documenting why it is needed and ensuring it
  works with the current build and test setup.
- Chart rendering must be deterministic for the same input data and filters.
- Axis labels, tick values, tooltips, and legends must use the existing Naira
  formatter.
- Tooltips must not be the only way to discover a value.
- Charts must resize within the existing responsive card layout and remain
  usable at mobile widths.
- Do not rely on animation for meaning. Respect
  `prefers-reduced-motion: reduce`.

## 7. Accessibility requirements

Charts must be understandable without relying on color, hover, a mouse, or
vision alone.

- Use a visible heading such as `Spending Insights`.
- Wrap each chart in a labelled region with a meaningful accessible name.
- Give each chart a short text summary and a full data table or equivalent
  keyboard-readable list.
- Ensure every category series has a unique combination of color and a
  non-color distinction such as line dash, marker shape, or pattern.
- Provide a visible legend that names every series.
- Use sufficient contrast for text, lines, bars, focus indicators, and states.
- Ensure controls have explicit labels, visible focus states, and logical
  keyboard order.
- Make category selection operable with keyboard and expose selected state to
  assistive technology.
- Announce filter changes and no-data/error states through an appropriate
  live region without causing excessive announcements.
- Do not use emoji or color as the sole category identifier; retain the
  category name in every legend, label, table, and summary.
- Tables must use proper headers and scope attributes.
- Verify at browser zoom of 200% and on narrow screens without clipping
  essential information.

## 8. Reliability and failure-proofing

### 8.1 Defensive behavior

- Guard all chart calculations against malformed local-storage data.
- Keep calculation logic separate from rendering so it can be tested directly.
- Use stable category IDs and stable series keys; never use array indexes as
  React keys.
- Avoid mutating source arrays during sorting or grouping.
- Handle a single data point, equal values, all-zero values, and large value
  ranges when calculating chart domains.
- Ensure a chart with one selected category still has valid axes and a legend.
- Ensure filter changes cannot display stale series or stale summary metrics.
- If chart rendering fails, show a clear inline error state while leaving the
  rest of the expense tracker usable.

### 8.2 Regression protection

Add focused automated tests for:

- Category totals within a date range.
- Daily, weekly, and monthly bucketing.
- Multiple same-day expenses being counted independently.
- Multiple selected categories producing separate series plus a correct total.
- Inclusive date boundaries.
- Empty data and no selected categories.
- Unknown categories and malformed amounts/dates.
- Zero-spend categories and all-zero chart domains.
- Recalculation after adding or deleting an expense.
- Recalculation after changing the selected period or categories.
- Accessible names, legends, summaries, tables, labels, and keyboard controls.

Run the existing test suite and production build after implementation:

```bash
npm test
npm run test:bug
npm run build
```

## 9. Acceptance criteria

The feature is complete when:

1. Users can view spending by category and spending trends over time.
2. Users can select multiple categories and compare them in one chart.
3. Changing period or category filters immediately recalculates every chart and
   metric.
4. Values match the underlying expense records, including multiple expenses on
   one date.
5. Empty, malformed, unknown, and zero-value data produce useful states rather
   than crashes or misleading charts.
6. Every chart has an equivalent non-visual data representation.
7. Category series remain distinguishable without color alone.
8. Controls and chart data are keyboard and screen-reader accessible.
9. Existing expense, budget, persistence, and reset behavior continues to
   work.
10. The focused tests, existing tests, regression test, and production build
    pass.

## 10. Out of scope

- Backend storage, accounts, authentication, or data synchronization.
- Editing or deleting categories.
- Forecasting future spending.
- Automatic financial advice or recommendations.
- Exporting charts or generating reports.
- Budget changes based on chart interactions.
