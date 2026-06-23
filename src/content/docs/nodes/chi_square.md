---
title: chi_square
description: "Chi-square test of independence between two categorical columns."
---

Chi-square test of independence between two categorical columns.

## Mental model

A `chi_square` node builds a contingency table from two categorical columns, then tests whether their observed counts depart from independence.

## When to use

Testing whether two categorical variables are independent (e.g. is region associated with product preference?).

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one table. |
| `columnA` | yes | First categorical variable. |
| `columnB` | yes | Second categorical variable. |

## Inputs

1 input.

## Outputs

`default`: an object with `type`, `columnA`, `columnB`, `n`, `dof`, `chi_square`, `p_value`, and `effect_size`.

## Editor and report behavior

- Report output should make the tested columns and Cramer’s V/effect size visible.
- When expected counts are low, warnings should be hard to miss because the p-value approximation can be invalid.

## Warnings and assumptions

- `CHI_SQUARE_EXPECTED_CELL_TOO_LOW` is critical when any expected cell count is below 1.
- `CHI_SQUARE_EXPECTED_CELL_LOW_FREQUENCY` warns when more than 20% of expected cells are below 5.

## Example

```yaml
- id: cs
  kind: chi_square
  inputs: [data]
  columnA: site
  columnB: age_group
```

## Modeling notes

- Chi-square is unreliable when expected cell counts are < 5. For small tables, use Fisher's exact instead (not built in).
- A significant chi-square just means "not independent" — it doesn't tell you which cells contribute most. Inspect the contingency table.
- A significant result means the variables are not independent; inspect the contingency table to understand which cells drive the result.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Reports](/rime-docs/concepts/reports/) — warning callouts in generated reports
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
