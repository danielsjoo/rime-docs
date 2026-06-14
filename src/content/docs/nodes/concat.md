---
title: concat
description: "Stack tables row-wise with a label column distinguishing the source of each row."
---

Stack tables row-wise with a label column distinguishing the source of each row.

## When to use

Combining same-shaped tables from different sources (e.g. monthly extracts, multi-site cohorts).

## Inputs

2+ inputs.

## Outputs

`default`: the concatenated table with an added `source:` column (configurable name) indicating which input each row came from.

## Example

```yaml
- id: combined
  kind: concat
  inputs: [batch_a, batch_b]     # ≥2
  groupColumn: batch              # added column tagging each row's source
  groupLabels: [a, b]             # optional; defaults to input ref strings
  schemaMode: union               # strict | intersect | union, default strict
```

## Common pitfalls

- All inputs must share the same column names. Use `select` first if schemas differ.
- The label column makes it easy to filter downstream by source: `filter` on `[source] == "site_a"`.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
