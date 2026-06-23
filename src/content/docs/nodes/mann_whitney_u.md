---
title: mann_whitney_u
description: "Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum)."
---

Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum).

## Mental model

A `mann_whitney_u` node compares two groups by ranks rather than raw means. It is useful when the mean/normality story is not credible.

## When to use

When you want to compare two groups but your data isn't normally distributed (skewed, ordinal, has outliers). Tests the null that values from group A are equally likely to be larger or smaller than values from group B.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Numeric or ordinal outcome. |
| `groupColumn` | yes | Column containing group labels. |
| `groupA`, `groupB` | yes | The two group values to compare. |

## Inputs

1 input.

## Outputs

`default`: an object with `type`, `valueColumn`, `groupColumn`, `groupA`, `groupB`, `nA`, `nB`, `u`, `z`, `p_value`, `effect_size`, and `effect_size_ci_95`.

## Editor and report behavior

- Report output should show U, z, p-value, effect size, confidence interval, and group sizes.
- Because this is rank-based, the surrounding docs/UI should avoid saying it directly tests medians in all cases.

## Warnings and assumptions

- The current assumption-warning pass does not emit Mann-Whitney-specific warnings yet.
- The node still validates that both requested groups have numeric values before producing a result.

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

## Modeling notes

- Mann-Whitney tests stochastic dominance, not medians. If your two distributions have different shapes, the test result doesn't cleanly map to "the medians differ."
- For very small samples (n < 5 per group), the asymptotic p-value is unreliable; use an exact, permutation, or bootstrap approach in a Python/R node if the distinction matters.
- Mann-Whitney is a rank/stochastic-dominance test. It is not automatically a “median test” when distributions have different shapes.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [t_test](/rime-docs/nodes/t_test/) — mean-based alternative when assumptions are credible
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
