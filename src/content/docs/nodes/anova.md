---
title: anova
description: "One-way analysis of variance across N groups."
---

One-way analysis of variance across N groups.

## When to use

Comparing means across three or more groups. For exactly two groups, use `t_test`. For non-normal data, consider Kruskal-Wallis (not built in — write a `kind: python` node).

## Inputs

1 input. Data with a continuous outcome column and a grouping column.

## Outputs

`default`: a JSON-shaped result with `F_statistic`, `p_value`, `df_between`, `df_within`, and per-group sample sizes / means.

## Example

```yaml
- id: a
  kind: anova
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupLabels: [a, b, c]          # optional
```

## Common pitfalls

- ANOVA assumes group variances are roughly equal. If they're not, results are less reliable; consider a non-parametric alternative.
- A significant overall F doesn't tell you which groups differ — follow up with pairwise `t_test` nodes for the comparisons you care about.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
