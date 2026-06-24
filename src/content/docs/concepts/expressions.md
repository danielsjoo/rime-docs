---
title: Expression language
description: The small formula language used by filter, derive, aggregate, select, sort, and expression join keys.
---

Rime's expression language is the shared formula syntax behind core transform nodes. It is intentionally smaller than Python or SQL: enough for row filters, feature columns, grouping keys, aggregate metrics, sort keys, and expression join keys, while staying readable in YAML and inspectable in the editor.

## Where Expressions Appear

| Node | Fields | Meaning |
| --- | --- | --- |
| [`filter`](/nodes/filter/) | `expr` | Keep rows where the expression is truthy |
| [`derive`](/nodes/derive/) | `expr` | Compute one new column named by `as` |
| [`aggregate`](/nodes/aggregate/) | `groupBy`, `metrics` | Define grouping keys and named reductions |
| [`select`](/nodes/select/) | `columns` | Runtime projection expressions; schema currently restricts these to identifiers |
| [`sort`](/nodes/sort/) | `by[].expr` | Compute sort keys |
| [`join`](/nodes/join/) | `leftKey`, `rightKey` | Bare column names, or expressions when the key is not a bare identifier |

## Column References

Column names go in square brackets.

```yaml
expr: "[age] >= 18"
expr: "[Cost of Goods Sold] / [revenue]"
```

Use brackets even when a column name looks like an identifier. That keeps expressions visually distinct from YAML field names and string literals.

## Literals And Operators

Expressions support numbers, strings, booleans, and null:

```yaml
expr: "[status] == 'active' and [score] >= 0.8"
expr: "[site] in ('north', 'south')"
expr: "not ([deleted] == true)"
```

Supported operator groups:

| Group | Operators |
| --- | --- |
| Arithmetic | `+`, `-`, `*`, `/`, unary `-` |
| Comparison | `==`, `!=`, `>`, `>=`, `<`, `<=` |
| Boolean | `and`, `or`, `not` |
| Membership | `in (...)` with a parenthesized literal list |

Parentheses work for grouping.

```yaml
expr: "coalesce([baseline_score], 0) * 0.55 + coalesce([lab_load], 0) * 1.4"
```

## Function Calls

Function calls operate across expressions.

| Function | Use |
| --- | --- |
| `coalesce(a, b, ...)` | Fill null values from the next expression |
| `concat(a, b, ...)` | Concatenate expressions as strings |
| `max(a, b, ...)` | Horizontal maximum across expressions |
| `min(a, b, ...)` | Horizontal minimum across expressions |

Example:

```yaml
- id: risk_index
  kind: derive
  inputs: [lab_load]
  as: risk_index
  expr: "coalesce([baseline_score], 0) * 0.55 + coalesce([lab_load], 0) * 1.4"
```

## Column Methods

Methods hang off a column or expression.

| Method | Common place | Use |
| --- | --- | --- |
| `.uppercase()`, `.lowercase()` | derive, sort, join keys | Normalize strings |
| `.to_date()`, `.to_int()`, `.to_float()`, `.to_string()` | derive | Cast values |
| `.sum()`, `.mean()`, `.count()`, `.min()`, `.max()` | aggregate metrics | Reduce a group |
| `.n_unique()`, `.distinct()` | aggregate metrics | Count distinct values |
| `.lag(n)`, `.lead(n)` | sort/derive patterns | Shift values |
| `.rolling_mean(n)` | feature engineering | Rolling average |
| `.first_value()`, `.rank()` | grouped/window-like features | First value or rank |
| `.sort_by(expr)`, `.over(expr)` | advanced Polars-backed expressions | Sort/window context |

Aggregate metrics should name their output with an alias expression:

```yaml
metrics:
  - "[mean_crp] = [crp].mean()"
  - "[n_visits] = [crp].count()"
```

## Alias Expressions

Alias expressions use a bracketed output name on the left side:

```yaml
"[mean_score] = [score].mean()"
```

Use aliases in `aggregate.metrics`. For `derive`, prefer `as:` instead:

```yaml
- id: lab_load
  kind: derive
  as: lab_load
  expr: "coalesce([crp_mean], 0) * 1.6 + coalesce([ldl_max], 0) * 0.035"
```

## Practical Patterns

### Null-safe Score

```yaml
expr: "coalesce([baseline_score], 0) + coalesce([followup_score], 0)"
```

### Cohort Filter

```yaml
expr: "[age] >= 18 and [site] in ('north', 'south')"
```

### Grouped Rollup

```yaml
groupBy:
  - "[site]"
metrics:
  - "[mean_risk] = [risk_index].mean()"
  - "[n] = [patient_id].count()"
```

### Computed Join Key

```yaml
- id: joined
  kind: join
  inputs: [left_table, right_table]
  leftKey: "[site].lowercase()"
  rightKey: "[site_code].lowercase()"
```

For important computed keys, a separate `derive` node is often easier to review than hiding the key logic inside the `join`.

## Limits

The expression language is not a general scripting language. Use a Python, R, JavaScript, or SQL node when you need multi-step control flow, external libraries, custom statistical routines, or transformations that are clearer as code.
