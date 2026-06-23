---
title: t_test
description: "Two-sample t-test with either pooled equal-variance or Welch-style unequal-variance standard errors."
---

Two-sample t-test with either pooled equal-variance or Welch-style unequal-variance standard errors.

## Mental model

A `t_test` node consumes one tidy table and emits a stat object, not another table. It compares two named groups inside one `groupColumn`.

## When to use

Comparing means of a continuous variable between two groups (control vs treatment, region A vs region B). `equalVariance: true` is the schema default; set `equalVariance: false` when you want the Welch-style unequal-variance calculation. For ordinal or heavily non-normal data, use `mann_whitney_u` instead.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one tidy table. |
| `valueColumn` | yes | Continuous numeric outcome. |
| `groupColumn` | yes | Column containing group labels. |
| `groupA`, `groupB` | yes | The two group values to compare. |
| `equalVariance` | no | `true` by default; set `false` for Welch-style unequal-variance standard errors. |

## Inputs

1 input. The data must contain both a value column and a grouping column.

## Outputs

`default`: an object with `type`, `valueColumn`, `groupColumn`, `groupA`, `groupB`, `equalVariance`, `nA`, `nB`, `meanA`, `meanB`, `mean_diff`, `t_statistic`, `dof`, `p_value`, `mean_diff_ci_95`, and `effect_size`.

## Editor and report behavior

- In reports, this renders as a stat object rather than a table. Surface `p_value`, `mean_diff`, confidence interval, and warnings together.
- In the editor, show the two group sizes before the statistic; a significant p-value with tiny groups should feel suspicious.

## Warnings and assumptions

- Warnings include `TT_GROUP_SAMPLE_VERY_SMALL`, `TT_GROUP_SAMPLE_SMALL`, `TT_GROUP_NON_NORMAL_SHAPE`, `TT_GROUP_OUTLIER_RATE_MODERATE`, `TT_GROUP_OUTLIER_RATE_HIGH`, and `TT_VARIANCE_RATIO_HIGH`.
- `TT_VARIANCE_RATIO_HIGH` only applies when `equalVariance: true` and the group variance ratio is at least 4.

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

## Modeling notes

- Welch-style t-test (`equalVariance: false`) is more robust to unequal variances. Use the equal-variance variant only if you have strong reason to assume homogeneity.
- The `groupA` and `groupB` values must exist in `groupColumn`; otherwise validation fails at run time.
- Use one tidy table with a grouping column instead of two separate inputs.
- Use `concat` to stack two cohorts first when the cohorts start in separate branches.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [concat](/rime-docs/nodes/concat/) — stack cohorts before running a grouped test
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
