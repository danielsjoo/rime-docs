---
title: t_test
description: "Two-sample t-test — Welch (default) or equal-variance."
---

Two-sample t-test — Welch (default) or equal-variance.

## When to use

Comparing means of a continuous variable between two groups (control vs treatment, region A vs region B). For non-normal data, use `mann_whitney_u` instead.

## Inputs

1 input. The data must contain both a value column and a grouping column.

## Outputs

`default`: a JSON-shaped result with `t_statistic`, `p_value`, `df`, `mean_a`, `mean_b`, and the sample sizes.

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

## Common pitfalls

- Welch t-test (`equalVariance: false`, the default) is robust to unequal variances. Use the equal-variance variant only if you have strong reason to assume homogeneity.
- The `groupA` and `groupB` values must exist in `groupColumn`; otherwise validation fails at run time.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
