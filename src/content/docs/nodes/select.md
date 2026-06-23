---
title: select
description: "Keep a subset of columns by name."
---

Keep a subset of columns by name.

## Mental model

A `select` node is a projection. It narrows a table to the columns, aliases, or expressions that downstream work should see.

## When to use

Pruning before joins or expensive language nodes — narrower tables are cheaper to serialize across language boundaries.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `columns` | yes | Array of selected columns. Runtime compiles each entry as an expression, while the schema currently restricts them to identifier-shaped strings. |

## Inputs

1 input.

## Outputs

`default`: the input table restricted to columns listed in `columns:`.

## Expression language

- `columns` are schema-limited to identifier-shaped strings today, but runtime projection compiles them as expressions.
- For derived expressions with clear names, prefer an upstream `derive` followed by `select` for readability.

## Editor and report behavior

- The preview should feel like a schema check: columns kept, columns dropped, and final ordering.
- This node is a good place for the editor to warn about accidental over-wide downstream tables.

## Example

```yaml
- id: keep_cols
  kind: select
  inputs: [data]
  columns: [a, b, c]
```

## Modeling notes

- Columns are kept in the order you list them. If you care about column ordering in the report, this is the node that controls it.
- Selecting a nonexistent column is a hard error (caught at validate time).

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — projection expression syntax
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
