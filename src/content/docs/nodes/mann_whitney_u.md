---
title: mann_whitney_u
description: "Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum)."
---

`mann_whitney_u` compares two groups by rank ordering the outcome values. It is the built-in escape from a shaky mean/normality story.

Use it for skewed continuous values, ordinal scores, or outlier-heavy groups when a rank-based comparison is easier to defend than a mean comparison.

## Rank-test contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Numeric or ordinal outcome. |
| `groupColumn` | yes | Column containing group labels. |
| `groupA`, `groupB` | yes | The two group values to compare. |

## What question it answers

`default` reports group sizes, U, z, p-value, effect size, and a 95% effect-size confidence interval.

The null is rank/stochastic balance: values from group A are not systematically larger or smaller than values from group B. Do not describe it as a guaranteed median test when the distributions have different shapes.

## Limits

- The current assumption-warning pass does not emit Mann-Whitney-specific warnings yet.
- Very small groups make the asymptotic p-value fragile. Use an exact, permutation, or bootstrap approach in Python/R when that distinction matters.
- Both requested groups must exist and have numeric values before the node can produce a result.

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

## Related

- [t_test](/nodes/t_test/) - mean-based alternative when assumptions are credible
