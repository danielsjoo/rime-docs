---
title: select
description: "Keep a subset of columns by name."
---

`select` is a schema decision. It keeps the columns you name, in the order you name them.

Use it to make the next node cheaper and clearer: trim wide source tables, prepare a report table, or define the exact payload crossing into a language node.

## Projection contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `columns` | yes | Array of selected columns. Runtime compiles each entry as an expression, while the schema currently restricts them to identifier-shaped strings. |

## Review notes

- `default` is the same rows with only the selected columns.
- Column order is part of the node behavior, so use `select` when report ordering matters.
- Selecting a nonexistent column is a hard validation error.

## Example

```yaml
- id: keep_cols
  kind: select
  inputs: [data]
  columns: [a, b, c]
```

## Related

- [derive](/nodes/derive/) - create named features before selecting them
- [Expression language](/concepts/expressions/) - projection syntax notes
