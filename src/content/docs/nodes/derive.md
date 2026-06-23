---
title: derive
description: "Add a computed column from existing columns."
---

`derive` adds one computed column. It is the right node when a feature deserves a name and should be inspectable in the DAG.

Prefer a chain of small derives over one opaque script when each intermediate feature is useful for review. Use a language node when the computation needs loops, model code, external packages, or multiple output columns at once.

## Feature contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `as` | yes | Identifier-shaped output column name. |
| `expr` | yes | Expression compiled to a Polars expression and aliased to `as`. |

## Writing the expression

- `expr` is compiled to Polars and aliased to `as`, so the expression itself does not need an assignment.
- Use `coalesce()` when nulls should become a default value instead of following native null behavior.
- The new `as` column cannot collide with an existing column. Drop or rename first if you mean to replace something.

## Reviewing the result

The preview should make the new column easy to find. For numeric features, a distribution/profile is usually more useful than a long row sample.

`default` is the input table plus the new column.

## Example

```yaml
- id: lab_load
  kind: derive
  inputs: [patient_lab]         # length 1
  as: lab_load                   # new column name
  expr: "[crp_mean] * [ldl_max] / 1000.0"
```

## Related

- [Expression language](/concepts/expressions/) - supported operators and functions
- [select](/nodes/select/) - narrow or reorder columns after deriving
