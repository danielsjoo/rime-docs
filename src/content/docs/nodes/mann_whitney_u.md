---
title: mann_whitney_u
description: "Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum)."
---

Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum).

## When to use

When you want to compare two groups but your data isn't normally distributed (skewed, ordinal, has outliers). Tests the null that values from group A are equally likely to be larger or smaller than values from group B.

## Inputs

1 input.

## Outputs

`default`: a JSON-shaped result with `U_statistic`, `p_value`, and the sample sizes.

## Example

```yaml
- id: mw
  kind: mann_whitney_u
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupA: control
  groupB: treatment
```

## Common pitfalls

- Mann-Whitney tests stochastic dominance, not medians. If your two distributions have different shapes, the test result doesn't cleanly map to "the medians differ."
- For very small samples (n < 5 per group), the asymptotic p-value is unreliable — use Fisher's exact alternatives.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
