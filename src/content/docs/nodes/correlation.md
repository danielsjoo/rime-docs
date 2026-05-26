---
title: correlation
description: "Pearson or Spearman correlation between two columns."
---

Pearson or Spearman correlation between two columns.

## When to use

Quick check of linear (Pearson) or rank-order (Spearman) relationship between two continuous columns. For non-linear relationships, prefer `linear_regression` with feature engineering, or a Python script for more sophisticated measures.

## Inputs

1 input.

## Outputs

`default`: a JSON-shaped result with `coefficient`, `p_value`, `n`, and the method used.

## Example

```yaml
- id: cor
  kind: correlation
  inputs: [data]
  columnA: x
  columnB: y
  method: pearson                 # pearson | spearman, default pearson
```

## Common pitfalls

- Pearson assumes normality and linearity; Spearman is more robust but only captures monotonic relationships.
- Correlation is not causation. The node won't tell you which way the arrow points.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
