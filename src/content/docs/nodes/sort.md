---
title: sort
description: "Order rows by one or more expressions."
---

Order rows by one or more expressions.

## When to use

Sorting for the report renderer, or before a window-like derive. For top-N, sort + a downstream Python script that does `.head(N)`.

## Inputs

1 input.

## Outputs

`default`: the input rows reordered by the sort keys.

## Example

```yaml
- id: sorted
  kind: sort
  inputs: [data]
  by:
    - { expr: "[total_bill]", direction: desc }
    - { expr: "[date]", direction: asc }
```

## Common pitfalls

- `direction` defaults to `asc`. Use `desc` explicitly when you want descending.
- Multi-key sort: order in the `by:` array is significant (primary, secondary, tertiary key).

## See also

- [Language node reference](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
