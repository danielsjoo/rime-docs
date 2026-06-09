---
title: linear_regression
description: "Single-feature ordinary least squares regression, with optional train/test split."
---

Single-feature ordinary least squares regression, with optional train/test split.

## When to use

Quick single-predictor regression for a report stat callout. For multi-feature regression or non-linear models, use a `kind: python` node with statsmodels or scikit-learn.

## Inputs

1 input.

## Outputs

`default`: a JSON-shaped result with `intercept`, `slope`, `r_squared`, `p_value`, and (if `splitRatio` set) train/test metrics.

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

## Common pitfalls

- Single feature only. If you need multiple predictors, this is the wrong node.
- `splitRatio` defaults to no split (training on all data). Set to e.g. 0.8 if you want a held-out test set.

## See also

- [Language node reference](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
