# Automated Tests

## Test coverage added or maintained

### Pure calculation tests — `tests/expenseCalculations.test.js`

- Inclusive date filtering.
- Invalid date and amount filtering.
- Category totals, transaction counts, percentages, and zero-spend categories.
- Daily, weekly, and monthly time buckets.
- Chronological zero-filled series.
- Multiple categories, separate series, and combined totals.
- Spending metrics including averages, highest bucket, and highest category.
- Previous-period range and comparison calculations.
- Date and currency formatter behavior.

### Application tests — `tests/components.test.jsx`

- Custom date controls appear for the custom period.
- A future range with no matching expenses produces a readable empty state.
- Clearing all categories produces an explicit selection empty state.
- Existing add, delete, sorting, budget, persistence, validation, and reset flows remain covered.

### Regression tests — `tests/regression/totalExpenses.test.jsx`

- Multiple expenses on the same date are included independently.
- Dashboard total matches the sum of all sample expenses.
- Remaining balance uses the corrected total.

## Commands executed

| Command | Result |
| --- | --- |
| `npm test` | Passed — 2 files, 48 tests |
| `npm run test:bug` | Passed — 1 file, 4 tests |
| `npm run build` | Passed — production bundle generated in `dist/` |

## Coverage limitations

The current suite does not include automated browser-level checks for 200% zoom,
multiple narrow viewport widths, screen-reader announcements, or a full
axe-style accessibility audit. Those remain manual or future automated-test
opportunities.
