---
title: correlation
description: "Pearson or Spearman correlation between two columns."
---

Pearson or Spearman correlation between two columns.

## Mental model

A `correlation` node summarizes pairwise association between two numeric columns. It is exploratory evidence, not a causal model.

## When to use

Quick check of linear (Pearson) or rank-order (Spearman) relationship between two continuous columns. For non-linear relationships, prefer `linear_regression` with feature engineering, or a Python script for more sophisticated measures.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `columnA`, `columnB` | yes | Numeric columns to pair row-wise. |
| `method` | no | `pearson` by default; `spearman` ranks values first. |

## Inputs

1 input.

## Outputs

`default`: an object with `type`, `columnA`, `columnB`, `method`, `n`, `coefficient`, `t_statistic`, `p_value`, `effect_size`, and `coefficient_ci_95`.

## Editor and report behavior

- Report output should show method, coefficient, p-value, n, and the coefficient confidence interval.
- If Pearson and Spearman disagree, the warning is often the most important part of the node.

## Warnings and assumptions

- `CORRELATION_SAMPLE_SMALL` is informational when n is below 20.
- `CORRELATION_PEARSON_OUTLIER_SENSITIVE` warns when Pearson and Spearman differ by at least 0.2.

## Example

```yaml
- id: cor
  kind: correlation
  inputs: [data]
  columnA: x
  columnB: y
  method: pearson                 # pearson | spearman, default pearson
```

## Modeling notes

- Pearson assumes normality and linearity; Spearman is more robust but only captures monotonic relationships.
- Correlation is not causation. The node won't tell you which way the arrow points.
- Pearson measures linear association. Spearman ranks first and is better for monotonic but non-linear relationships.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [linear_regression](/rime-docs/nodes/linear_regression/) — model a directional relationship
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
