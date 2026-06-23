---
title: anova
description: "One-way analysis of variance across N groups."
---

One-way analysis of variance across N groups.

## Mental model

An `anova` node is the multi-group sibling of `t_test`: one continuous outcome, one grouping column, and an overall F-test across groups.

## When to use

Comparing means across three or more groups. For exactly two groups, use `t_test`. For non-normal data, consider Kruskal-Wallis (not built in — write a `kind: python` node).

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Continuous numeric outcome. |
| `groupColumn` | yes | Column containing two or more groups. |
| `groupLabels` | no | Optional display/order hint for the groups. |

## Inputs

1 input. Data with a continuous outcome column and a grouping column.

## Outputs

`default`: an object with `type`, `valueColumn`, `groupColumn`, `n`, `groups`, `df_between`, `df_within`, `f_statistic`, `p_value`, and `effect_size`.

## Editor and report behavior

- Report output should show the F statistic, p-value, effect size, degrees of freedom, and per-group means.
- Group sample sizes and warnings belong next to the result, not hidden below the fold.

## Warnings and assumptions

- Warnings include `ANOVA_GROUP_SAMPLE_VERY_SMALL`, `ANOVA_GROUP_SAMPLE_SMALL`, `ANOVA_GROUP_NON_NORMAL_SHAPE`, `ANOVA_GROUP_OUTLIER_RATE_MODERATE`, `ANOVA_GROUP_OUTLIER_RATE_HIGH`, and `ANOVA_VARIANCE_RATIO_HIGH`.
- `ANOVA_VARIANCE_RATIO_HIGH` fires when group variances differ by at least 4x.

## Example

```yaml
- id: a
  kind: anova
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupLabels: [a, b, c]          # optional
```

## Modeling notes

- ANOVA assumes group variances are roughly equal. If they're not, results are less reliable; consider a non-parametric alternative.
- A significant overall F doesn't tell you which groups differ — follow up with pairwise `t_test` nodes for the comparisons you care about.
- ANOVA answers whether at least one group mean differs; it does not identify which pair differs.
- Follow with planned pairwise `t_test` nodes only for comparisons you can justify.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [t_test](/rime-docs/nodes/t_test/) — pairwise follow-up comparisons
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
