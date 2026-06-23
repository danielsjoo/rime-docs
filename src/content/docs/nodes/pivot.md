---
title: pivot
description: "Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value."
---

Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value.

## Mental model

A `pivot` node makes a long table wide: index columns define rows, a categorical column becomes output columns, and one value column is aggregated into each cell.

## When to use

Crosstabs, monthly summaries, A/B comparisons with each variant as a column. Inverse of an unpivot — use a Python script for un-pivot.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `index` | yes | Columns that remain as row identity in the wide result. |
| `columns` | yes | Categorical column whose distinct values become output columns. |
| `values` | yes | Numeric value column to aggregate into each pivot cell. |
| `agg` | no | `sum` by default; also supports `mean` and `count`. |

## Inputs

1 input.

## Outputs

`default`: the pivoted wide-format table.

## Editor and report behavior

- The preview should show the new wide columns and total width; high-cardinality pivots can become unreadable fast.
- The editor should make `agg` visible because it changes the meaning of every pivoted cell.

## Warnings and assumptions

- Only finite numeric values contribute to `sum` and `mean` cells; empty buckets become null except `count`, which returns counts.
- High-cardinality `columns` values create very wide output tables.

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

## Modeling notes

- `agg:` defaults to `sum`. Use `mean` or `count` when sum doesn't make sense.
- High-cardinality `columns:` values produce wide tables that are hard to read. Filter the input first.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
