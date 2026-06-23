---
title: anova
description: "One-way analysis of variance across N groups."
---

`anova` is the multi-group mean-comparison node. It asks whether at least one group mean differs from the others.

It is not a pairwise explanation tool. A significant F-test tells you the groups are not all behaving alike; it does not tell you which pair caused the result.

## Test contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Continuous numeric outcome. |
| `groupColumn` | yes | Column containing two or more groups. |
| `groupLabels` | no | Optional display/order hint for the groups. |

## How to read the result

`default` includes group summaries, between/within degrees of freedom, the F statistic, p-value, and effect size.

Use `groupLabels` when group order or display names matter in a report.

## Assumptions and follow-up

- Watch sample-size, shape, outlier, and variance-ratio warnings next to the result.
- Plan follow-up pairwise `t_test` nodes only for comparisons you can justify, not every possible pair by reflex.
- For a non-parametric multi-group alternative, use a Python/R node for Kruskal-Wallis or permutation testing.

## Example

```yaml
- id: a
  kind: anova
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupLabels: [a, b, c]          # optional
```

## Related

- [t_test](/nodes/t_test/) - planned pairwise mean comparisons
