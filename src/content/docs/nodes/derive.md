---
title: derive
description: "Add a computed column from existing columns."
---

Add a computed column from existing columns.

## Mental model

A `derive` node adds one named feature column. Chain several derives when you want an inspectable feature-building trail instead of one opaque script.

## When to use

Computed features (BMI, ratios, normalized scores). For a one-step pipeline where you derive several columns at once, chain multiple `derive` nodes — they're cheap.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `as` | yes | Identifier-shaped output column name. |
| `expr` | yes | Expression compiled to a Polars expression and aliased to `as`. |

## Inputs

1 input. The table to extend.

## Outputs

`default`: the input table with one additional column named by `as:`.

## Expression language

- `expr` uses the Rime expression language and is compiled to Polars.
- Use functions like `coalesce([score], 0)` for null-safe feature engineering.
- The node aliases the result to `as`, so the expression itself does not need an alias assignment.

## Editor and report behavior

- The table preview should highlight the new `as` column so reviewers can inspect the feature quickly.
- For numerical features, column profile deltas are often more useful than a large row sample.

## Warnings and assumptions

- Unsupported expression functions fail as `NODE_EXECUTION` errors from the compiler/runtime.
- Deriving over nulls follows Polars semantics; use `coalesce()` when nulls should become a default value.

## Example

```yaml
- id: lab_load
  kind: derive
  inputs: [patient_lab]         # length 1
  as: lab_load                   # new column name
  expr: "[crp_mean] * [ldl_max] / 1000.0"
```

## Modeling notes

- The new column name (`as:`) must not collide with an existing column. Use `select` first to drop the old one if you want to overwrite.
- Expressions can't reference other derived columns within the same node. Use a second `derive` for that.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — syntax for `expr`
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
