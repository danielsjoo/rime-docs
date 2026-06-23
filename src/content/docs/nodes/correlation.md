---
title: correlation
description: "Pearson or Spearman correlation between two columns."
---

`correlation` is a compact association check between two numeric columns. It is evidence for relationship, not a model of cause.

Use Pearson when a linear relationship is the question. Use Spearman when rank order or monotonic movement is more believable than raw linearity.

## Association contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `columnA`, `columnB` | yes | Numeric columns to pair row-wise. |
| `method` | no | `pearson` by default; `spearman` ranks values first. |

## How to read the result

`default` reports method, paired n, coefficient, p-value, effect size, and a 95% coefficient confidence interval.

Pearson/Spearman disagreement can be more useful than either number alone because it often points to outliers or non-linear shape.

## Watch for

- `CORRELATION_SAMPLE_SMALL` appears when n is below 20.
- `CORRELATION_PEARSON_OUTLIER_SENSITIVE` appears when Pearson and Spearman differ by at least 0.2.
- If you need a directional fitted relationship, move to `linear_regression`; if you need controls or nonlinear features, use Python/R.

## Example

```yaml
- id: cor
  kind: correlation
  inputs: [data]
  columnA: x
  columnB: y
  method: pearson                 # pearson | spearman, default pearson
```

## Related

- [linear_regression](/rime-docs/nodes/linear_regression/) - model a directional single-feature relationship
