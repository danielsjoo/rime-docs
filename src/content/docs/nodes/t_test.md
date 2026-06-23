---
title: t_test
description: "Two-sample t-test with either pooled equal-variance or Welch-style unequal-variance standard errors."
---

`t_test` compares the mean of one numeric outcome across two named groups in one tidy table. It returns a statistical object, not a transformed table.

Use it when a mean comparison is the honest question and the data is roughly compatible with a t-test story. If the outcome is ordinal, heavily skewed, or dominated by outliers, consider `mann_whitney_u` or a custom Python/R node.

## Test contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Continuous numeric outcome. |
| `groupColumn` | yes | Column containing group labels. |
| `groupA`, `groupB` | yes | The two group values to compare. |
| `equalVariance` | no | `true` by default; set `false` for Welch-style unequal-variance standard errors. |

## How to read the result

`default` reports group sizes, group means, mean difference, t statistic, degrees of freedom, p-value, a 95% confidence interval, and effect size.

`equalVariance: false` uses Welch-style unequal-variance standard errors. The schema default is `true`, so set it deliberately when variances may differ.

## Warnings that matter

- Small groups, non-normal shape, outlier rates, and high variance ratios can all produce warnings.
- `TT_VARIANCE_RATIO_HIGH` only fires for the equal-variance variant, because that is where unequal variances undercut the assumption.

## Example

```yaml
- id: tt
  kind: t_test
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupA: control
  groupB: treatment
  equalVariance: false            # default true
```

## Related

- [concat](/nodes/concat/) - stack two cohorts before testing
- [mann_whitney_u](/nodes/mann_whitney_u/) - rank-based alternative
