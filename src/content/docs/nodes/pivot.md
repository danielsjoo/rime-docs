---
title: pivot
description: "Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value."
---

Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value.

## When to use

Crosstabs, monthly summaries, A/B comparisons with each variant as a column. Inverse of an unpivot — use a Python script for un-pivot.

## Inputs

1 input.

## Outputs

`default`: the pivoted wide-format table.

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

## Common pitfalls

- `agg:` defaults to `sum`. Use `mean` or `count` when sum doesn't make sense.
- High-cardinality `columns:` values produce wide tables that are hard to read. Filter the input first.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
