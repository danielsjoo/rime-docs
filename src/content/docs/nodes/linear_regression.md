---
title: linear_regression
description: "Single-feature ordinary least squares regression, with optional train/test split."
---

Single-feature ordinary least squares regression, with optional train/test split.

## Mental model

A `linear_regression` node fits a single-predictor OLS line and emits coefficients, uncertainty, and fit statistics for a compact report callout.

## When to use

Quick single-predictor regression for a report stat callout. For multi-feature regression or non-linear models, use a `kind: python` node with statsmodels or scikit-learn.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `feature` | yes | Single numeric predictor. |
| `target` | yes | Numeric outcome. |
| `testFraction` | no | Optional holdout fraction between 0 and 1. |
| `seed` | no | Optional integer seed for deterministic splitting. |

## Inputs

1 input.

## Outputs

`default`: an object with `type`, `feature`, `target`, `n`, `slope`, `intercept`, `r2`, `p_value`, `slope_ci_95`, and `effect_size`.

## Editor and report behavior

- Report output should show slope, intercept, r2, p-value, confidence interval, effect size, and outlier warnings.
- The editor should be clear this is single-feature OLS, not a general modeling workbench.

## Warnings and assumptions

- `LINEAR_REGRESSION_SAMPLE_SMALL` is informational when n is below 20.
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

## Modeling notes

- Single feature only. If you need multiple predictors, this is the wrong node.
- `testFraction` defaults to no split (training on all data). Set a value like `0.2` when you want a deterministic held-out test fraction.
- This node is intentionally small: one predictor, one target. Use a Python/R node for multi-feature models, robust errors, or diagnostics beyond the built-in warnings.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [correlation](/rime-docs/nodes/correlation/) — lighter-weight association check
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
