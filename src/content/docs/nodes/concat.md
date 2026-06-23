---
title: concat
description: "Stack tables row-wise with a label column distinguishing the source of each row."
---

`concat` stacks peer tables row-wise and adds a label column that records where each row came from.

It is most useful when two or more branches represent comparable cohorts, batches, sites, or time slices and you want one tidy table downstream.

## Stacking contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Two or more upstream tables. |
| `groupColumn` | yes | New column added to every output row identifying the source input. |
| `groupLabels` | no | Labels for each input; defaults to the input refs. |
| `schemaMode` | no | `strict` by default; `intersect` keeps shared columns, `union` fills missing cells with null. |

## Schema mode is the decision

- `strict` requires the same column set and is safest when tables should match exactly.
- `intersect` keeps only shared columns and can silently drop useful fields if you are not looking.
- `union` keeps all columns and fills missing cells with null, which is flexible but should be followed by null-profile review.

## Result shape

`default` is the combined table with the added `groupColumn`. Check that the labels are readable, because those values often become filters or group names later.

## Example

```yaml
- id: combined
  kind: concat
  inputs: [batch_a, batch_b]     # ≥2
  groupColumn: batch              # added column tagging each row's source
  groupLabels: [a, b]             # optional; defaults to input ref strings
  schemaMode: union               # strict | intersect | union, default strict
```

## Related

- [t_test](/rime-docs/nodes/t_test/) - grouped tests often start by concatenating two cohorts
