---
title: join
description: "Two-input inner or left join on column keys."
---

Two-input inner or left join on column keys.

## When to use

Combining two tables on a shared key. For more than two inputs, chain multiple joins.

## Inputs

2 inputs. Left and right tables (order matters for left joins).

## Outputs

`default`: the joined table. Column names from the right side are suffixed to disambiguate if they collide with left-side names.

## Example

```yaml
- id: enriched
  kind: join
  inputs: [orders, customers]    # length 2
  leftKey: customer_id
  rightKey: id
  how: left                       # inner | left, default inner
```

## Common pitfalls

- `how: inner` (default) drops unmatched rows; `how: left` keeps all left-side rows with nulls for unmatched right-side columns.
- Many-to-many joins are allowed but produce the Cartesian product of matching rows — be careful with row count blow-up.

## See also

- [Language node reference](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
