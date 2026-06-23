---
title: join
description: "Two-input inner or left join on column keys."
---

Two-input inner or left join on column keys.

## Mental model

A `join` node combines two tables. The left input is the anchor, especially for `how: left`, and the right input enriches it.

## When to use

Combining two tables on a shared key. For more than two inputs, chain multiple joins.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly two upstream tables: left first, right second. |
| `leftKey` | yes | Bare column name or expression evaluated on the left table. |
| `rightKey` | yes | Bare column name or expression evaluated on the right table. |
| `how` | no | `inner` by default; `left` keeps all left rows. |

## Inputs

2 inputs. Left and right tables (order matters for left joins).

## Outputs

`default`: the joined table. Column names from the right side are suffixed to disambiguate if they collide with left-side names.

## Expression language

- `leftKey` and `rightKey` can be bare column names. If the value is not a bare identifier, it is parsed as an expression.
- Expression join keys are useful for normalized identifiers, but they can hide expensive or lossy matching logic; give those nodes clear labels.

## Editor and report behavior

- The editor should show both parent inputs and make left/right order clear.
- Row-count expansion after a join is worth surfacing because many-to-many matches can explode silently.

## Warnings and assumptions

- Many-to-many joins are allowed; watch row counts for unplanned Cartesian expansion.
- Expression keys are powerful but can mask type coercion. Prefer explicit upstream `derive` nodes when reviewers need to inspect the key.

## Example

```yaml
- id: enriched
  kind: join
  inputs: [orders, customers]    # length 2
  leftKey: customer_id
  rightKey: id
  how: left                       # inner | left, default inner
```

## Modeling notes

- `how: inner` (default) drops unmatched rows; `how: left` keeps all left-side rows with nulls for unmatched right-side columns.
- Many-to-many joins are allowed but produce the Cartesian product of matching rows — be careful with row count blow-up.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — expression join keys
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
