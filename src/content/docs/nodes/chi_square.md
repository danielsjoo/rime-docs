---
title: chi_square
description: "Chi-square test of independence between two categorical columns."
---

Chi-square test of independence between two categorical columns.

## When to use

Testing whether two categorical variables are independent (e.g. is region associated with product preference?).

## Inputs

1 input.

## Outputs

`default`: a JSON-shaped result with `chi2_statistic`, `p_value`, `df`, and the observed-vs-expected contingency table.

## Example

```yaml
- id: cs
  kind: chi_square
  inputs: [data]
  columnA: site
  columnB: age_group
```

## Common pitfalls

- Chi-square is unreliable when expected cell counts are < 5. For small tables, use Fisher's exact instead (not built in).
- A significant chi-square just means "not independent" — it doesn't tell you which cells contribute most. Inspect the contingency table.

## See also

- [Language node reference](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
