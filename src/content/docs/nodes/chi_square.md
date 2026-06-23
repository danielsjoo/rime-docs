---
title: chi_square
description: "Chi-square test of independence between two categorical columns."
---

`chi_square` builds a contingency table from two categorical columns and tests whether the observed counts depart from independence.

Use it when the question is about association between categories: site by outcome band, treatment by response class, product by region.

## Count-test contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `columnA` | yes | First categorical variable. |
| `columnB` | yes | Second categorical variable. |

## How to read the result

`default` includes the tested columns, n, degrees of freedom, chi-square statistic, p-value, and effect size.

A significant result means the variables are not independent. It does not identify which cells are responsible, so inspect the contingency table or residuals in a follow-up node if needed.

## Expected counts

- `CHI_SQUARE_EXPECTED_CELL_TOO_LOW` is critical when any expected cell count is below 1.
- `CHI_SQUARE_EXPECTED_CELL_LOW_FREQUENCY` warns when more than 20% of expected cells are below 5.
- For small 2x2 cases where approximation quality matters, use Fisher exact in Python/R.

## Example

```yaml
- id: cs
  kind: chi_square
  inputs: [data]
  columnA: site
  columnB: age_group
```

## Related

- [Reports](/concepts/reports/) - warning callouts in generated reports
