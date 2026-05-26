---
title: filter
description: "Keep rows matching a boolean expression."
---

Keep rows matching a boolean expression.

## When to use

Slicing a cohort, removing nulls, gating on a threshold. The expression DSL supports `and`, `or`, `not`, arithmetic, and column methods like `.mean()` (though method calls only make sense in `aggregate`, not `filter`).

## Inputs

1 input. The table to filter.

## Outputs

`default`: the input rows that satisfy `expr:`.

## Example

```yaml
- id: adults
  kind: filter
  inputs: [patients]            # length 1
  expr: "[age] >= 18"
```

## Common pitfalls

- Column references use `[brackets]`: `[age] >= 18`, not `age >= 18`.
- Filtering on a derived column requires a `derive` node first — you can't reference a column that doesn't exist yet.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
