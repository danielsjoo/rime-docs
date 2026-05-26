---
title: derive
description: "Add a computed column from existing columns."
---

Add a computed column from existing columns.

## When to use

Computed features (BMI, ratios, normalized scores). For a one-step pipeline where you derive several columns at once, chain multiple `derive` nodes — they're cheap.

## Inputs

1 input. The table to extend.

## Outputs

`default`: the input table with one additional column named by `as:`.

## Example

```yaml
- id: lab_load
  kind: derive
  inputs: [patient_lab]         # length 1
  as: lab_load                   # new column name
  expr: "[crp_mean] * [ldl_max] / 1000.0"
```

## Common pitfalls

- The new column name (`as:`) must not collide with an existing column. Use `select` first to drop the old one if you want to overwrite.
- Expressions can't reference other derived columns within the same node. Use a second `derive` for that.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
