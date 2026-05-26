---
title: Nodes
description: A tour of the 14 built-in node kinds plus the script node.
---

The unit of computation in Rime is a **node**. Each node has a `kind:` that picks which other fields apply.

There are 14 built-in kinds — split into transforms, joins, stats, and one composition primitive — plus the universal **`script`** node for custom Python/R/JS/SQL logic.

Per-kind field reference lives under [Node Reference](/nodes/) in the sidebar. This page is the conceptual tour.

## Source nodes

The starting points. One kind: `source`. Reads a file (CSV / JSON / NDJSON / Parquet) into a tabular value.

```yaml
- id: patients
  kind: source
  path: data/patients.csv
```

## Transforms (single-input)

| Kind | What it does |
|---|---|
| `filter` | Keep rows matching a boolean expression |
| `derive` | Add a computed column |
| `select` | Keep specific columns |
| `sort` | Order rows by one or more expressions |
| `aggregate` | Group + reduce, with named metrics |

## Combinators (multi-input)

| Kind | What it does |
|---|---|
| `join` | Two-input inner / left join on column keys |
| `concat` | Stack tables row-wise with a label column |
| `pivot` | Wide-format aggregation |

## Statistical nodes

These are **terminal** — they emit a small JSON-shaped result rather than a table. They feed `stat:` blocks in `report.yaml`.

| Kind | What it does |
|---|---|
| `t_test` | Welch / equal-variance two-sample t-test |
| `anova` | One-way ANOVA across N groups |
| `mann_whitney_u` | Non-parametric two-sample test |
| `chi_square` | Categorical independence test |
| `correlation` | Pearson / Spearman correlation between two columns |
| `linear_regression` | Single-feature OLS, optional train/test split |

## Composition

| Kind | What it does |
|---|---|
| `subgraph` | Embed an external `.dag.yaml` file with named bindings + outputs |

Subgraphs are opaque from the outside; their `bindings:` map outer node refs to inner slot names, and their `outputs:` map exposed names to inner refs.

## The script node

Anything you can't express with the built-ins. `script` nodes run in Python, R, JavaScript, or SQL. They declare inputs as **named slots** (a `in:` map) and the runtime delivers each slot as a native value in the target language (pandas DataFrame, R tibble, arrow table, DuckDB temp table).

```yaml
- id: features
  kind: script
  language: python
  source: scripts/features.py
  in:
    cohort:    upstream_node
    threshold: params.threshold
```

See [Polyglot runtime](/concepts/polyglot/) for the per-language protocol.

## Metadata (optional, all kinds)

```yaml
metadata:
  label: "Friendly node label"      # editor display
  group: "feature_engineering"      # editor grouping
  visual_stats: ["row_count"]       # engine emits these on each run
  cache: false                      # boolean or { policy: ttl, seconds: N }
```
