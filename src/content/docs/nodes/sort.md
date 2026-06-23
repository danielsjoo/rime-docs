---
title: sort
description: "Order rows by one or more expressions."
---

Order rows by one or more expressions.

## Mental model

A `sort` node changes row order without changing values. Use it when order matters for review, reports, or deterministic downstream sampling.

## When to use

Sorting for the report renderer, or before a window-like derive. For top-N, sort + a downstream Python script that does `.head(N)`.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `by` | yes | Ordered list of sort clauses. Earlier clauses are primary keys. |
| `by[].expr` | yes | Expression used as a sort key. |
| `by[].direction` | no | `asc` by default; set `desc` explicitly for descending order. |

## Inputs

1 input.

## Outputs

`default`: the input rows reordered by the sort keys.

## Expression language

- `by[].expr` uses the Rime expression language, so you can sort by computed keys such as `[last_name].lowercase()` or `[score] * -1`.
- Prefer explicit `direction: desc` over negating numeric expressions when the intent is simple descending order.

## Editor and report behavior

- The preview should show the first rows after sorting and the sort keys used.
- Sort nodes are often invisible in row/column counts, so the UI needs to make the ordering decision explicit.

## Example

```yaml
- id: sorted
  kind: sort
  inputs: [data]
  by:
    - { expr: "[total_bill]", direction: desc }
    - { expr: "[date]", direction: asc }
```

## Modeling notes

- `direction` defaults to `asc`. Use `desc` explicitly when you want descending.
- Multi-key sort: order in the `by:` array is significant (primary, secondary, tertiary key).

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — sort key expressions
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
