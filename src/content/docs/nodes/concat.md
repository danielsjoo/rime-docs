---
title: concat
description: "Stack tables row-wise with a label column distinguishing the source of each row."
---

Stack tables row-wise with a label column distinguishing the source of each row.

## Mental model

A `concat` node stacks peer tables row-wise and adds a group label. It is the clean way to turn separate cohorts into one tidy table for later stats.

## When to use

Combining same-shaped tables from different sources (e.g. monthly extracts, multi-site cohorts).

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Two or more upstream tables. |
| `groupColumn` | yes | New column added to every output row identifying the source input. |
| `groupLabels` | no | Labels for each input; defaults to the input refs. |
| `schemaMode` | no | `strict` by default; `intersect` keeps shared columns, `union` fills missing cells with null. |

## Inputs

2+ inputs.

## Outputs

`default`: the concatenated table with an added `source:` column (configurable name) indicating which input each row came from.

## Editor and report behavior

- The preview should show the added `groupColumn` and each label value.
- Schema mode should be prominent because `strict`, `intersect`, and `union` have very different review implications.

## Warnings and assumptions

- `strict` schema mode fails when inputs do not share the same column set.
- `union` fills missing columns with null; use it deliberately and inspect null profiles afterward.

## Example

```yaml
- id: combined
  kind: concat
  inputs: [batch_a, batch_b]     # ≥2
  groupColumn: batch              # added column tagging each row's source
  groupLabels: [a, b]             # optional; defaults to input ref strings
  schemaMode: union               # strict | intersect | union, default strict
```

## Modeling notes

- All inputs must share the same column names. Use `select` first if schemas differ.
- The label column makes it easy to filter downstream by source: `filter` on `[source] == "site_a"`.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
