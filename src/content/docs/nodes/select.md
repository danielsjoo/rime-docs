---
title: select
description: "Keep a subset of columns by name."
---

Keep a subset of columns by name.

## When to use

Pruning before joins or expensive language nodes — narrower tables are cheaper to serialize across language boundaries.

## Inputs

1 input.

## Outputs

`default`: the input table restricted to columns listed in `columns:`.

## Example

```yaml
- id: keep_cols
  kind: select
  inputs: [data]
  columns: [a, b, c]
```

## Common pitfalls

- Columns are kept in the order you list them. If you care about column ordering in the report, this is the node that controls it.
- Selecting a nonexistent column is a hard error (caught at validate time).

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
