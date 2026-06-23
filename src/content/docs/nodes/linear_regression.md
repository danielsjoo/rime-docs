---
title: linear_regression
description: "Single-feature ordinary least squares regression, with optional train/test split."
---

`linear_regression` fits one ordinary least squares line: one numeric feature, one numeric target.

It is intentionally small. Use it for a reportable single-feature relationship, not as a substitute for a modeling workflow.

## Model contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `feature` | yes | Single numeric predictor. |
| `target` | yes | Numeric outcome. |
| `testFraction` | no | Optional holdout fraction between 0 and 1. |
| `seed` | no | Optional integer seed for deterministic splitting. |

## How to read the result

`default` includes n, slope, intercept, r2, p-value, a 95% slope confidence interval, and effect size.

`testFraction` can reserve a deterministic holdout split. Add `seed` when you want that split to be repeatable.

## When not to use it

- Multiple predictors, interactions, robust standard errors, diagnostics, and nonlinear models belong in Python/R.
- `LINEAR_REGRESSION_SAMPLE_SMALL` appears when n is below 20.
- `LINEAR_REGRESSION_HIGH_RESIDUAL_OUTLIERS` warns when at least 5% of observations have residuals at or beyond 3 residual standard deviations.

## Example

```yaml
- id: lr
  kind: linear_regression
  inputs: [training]
  feature: x
  target: y
  testFraction: 0.2               # optional
  seed: 42                        # optional
```

## Related

- [correlation](/rime-docs/nodes/correlation/) - lighter-weight association check
