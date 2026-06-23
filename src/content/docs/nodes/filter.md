---
title: filter
description: "Keep rows matching a boolean expression."
---

Keep rows matching a boolean expression.

## Mental model

A `filter` node is a row gate. It keeps the same schema and changes only the set of rows, which makes it ideal for cohorts, quality gates, and thresholds.

## When to use

Slicing a cohort, removing nulls, gating on a threshold. The expression language supports boolean operators, arithmetic, comparisons, membership checks, and functions like `coalesce(...)`.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `expr` | yes | Boolean expression evaluated per row. Truthy rows are kept. |
| `metadata.label` | no | Use a readable label such as “Keep visits after baseline”; the expression itself is usually too terse for reviewers. |

## Inputs

1 input. The table to filter.

## Outputs

`default`: the input rows that satisfy `expr:`.

## Expression language

- `expr` uses the Rime expression language and must evaluate to a boolean per row.
- Use bracketed column refs (`[age]`) and plain literals (`18`, `"active"`, `true`, `null`).
- Aggregate methods like `.mean()` are not meaningful in a row filter; compute summaries upstream with `aggregate`.

## Editor and report behavior

- The selected node preview should make row-count change obvious: input rows vs output rows is the main story.
- Warnings or errors should point at the expression, not the whole node.

## Warnings and assumptions

- Expression parse or evaluation errors fail the node and skip downstream dependents.
- A filter that returns zero rows is valid, but downstream stats may fail because they have too few observations.

## Example

```yaml
- id: adults
  kind: filter
  inputs: [patients]            # length 1
  expr: "[age] >= 18"
```

## Modeling notes

- Column references use `[brackets]`: `[age] >= 18`, not `age >= 18`.
- Filtering on a derived column requires a `derive` node first — you can't reference a column that doesn't exist yet.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — syntax for `expr`
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
