---
title: pivot
description: "Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value."
---

`pivot` turns tidy/long data into a wide summary table. Index columns stay as row identity; distinct values from one column become output columns.

It is useful for crosstabs and compact comparison tables. It is also one of the easiest nodes to make unreadable if the pivot column has too many distinct values.

## Pivot contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `index` | yes | Columns that remain as row identity in the wide result. |
| `columns` | yes | Categorical column whose distinct values become output columns. |
| `values` | yes | Numeric value column to aggregate into each pivot cell. |
| `agg` | no | `sum` by default; also supports `mean` and `count`. |

## What each cell means

- `values` supplies the numeric value for each cell.
- `agg` decides how multiple rows in the same bucket collapse. The default is `sum`; use `mean` or `count` when that is the actual question.
- Empty buckets become null for `sum` and `mean`; `count` returns counts.

## Reviewing the result

`default` is the pivoted wide table. Inspect total width and the generated column names before sending it to reports or scripts.

## Example

```yaml
- id: monthly
  kind: pivot
  inputs: [sales]
  index: [region]
  columns: month
  values: revenue
  agg: sum                        # sum | mean | count, default sum
```

## Related

- [aggregate](/rime-docs/nodes/aggregate/) - grouped summaries without widening
