---
title: DAG specification
description: The shape of pipeline.dag.yaml.
---

`pipeline.dag.yaml` is the source of truth for graph shape, node configuration,
source paths, report inclusion, and optional interpreter/param defaults. For
per-node fields, use the [Node Reference](/rime-docs/nodes/).

## Top level

```yaml
specification_version: "2.1"    # required
nodes:                           # required, >= 1, acyclic, unique ids
  - ...
```

Optional top-level blocks:

```yaml
params:
  threshold: { type: float, default: 0.5 }
  cohort_date: { type: date, required: true }

interpreters:
  python: .venv/bin/python
  r: /usr/local/bin/Rscript
```

CLI flags and environment variables override inline interpreter and param
defaults at run time.

## Node shape (shared)

```yaml
- id: my_node                    # identifier-shaped, unique within DAG
  kind: <discriminator>          # source, filter, python, sql, etc.
  inputs: [upstream_id, ...]     # core nodes use positional inputs
  metadata:                      # optional; closed schema
    label: "Friendly label"
    group: "ingest"
    report: false                # omit or true to include in auto-report
    visual_stats: ["row_count"]
    cache: false                 # boolean | { policy: ttl, seconds: N }
```

Kind-specific fields live at the top level on the node: `expr`, `groupBy`,
`metrics`, `source`, `path`, `columnA`, and so on. There is no per-node
`params:` bag. Unknown fields are rejected.

## Core Node Inputs

Core nodes use `inputs:`:

```yaml
- id: adults
  kind: filter
  inputs: [patients]
  expr: "[age] >= 18"
```

Use `nodeId.outputName` when reading a non-default output from a multi-output
language node:

```yaml
- id: train_summary
  kind: aggregate
  inputs: [split.train]
  groupBy: ["[site]"]
  metrics:
    - "[n] = [score].count()"
```

## Language Node Inputs

Language nodes use named slots through `in:`. The slot key becomes the function
argument name for Python/R/JavaScript, or the temp table name for SQL.

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort: adults
    threshold: params.threshold
```

## Input ref grammar

Wherever a node references an upstream output:

- `node_id` — the default output of the named node
- `node_id.output_name` — a named output of a multi-output node

Used in `inputs:`, `in:`, `subgraph.bindings`, and `subgraph.outputs`.

## Validation

`validateDagSpec(parsed)` runs in this order:

1. Zod discriminated union validation per node — fails with `[V2_DAG_SCHEMA pipeline.dag.yaml:nodes[i].field]`
2. Unique node ids — `[V2_DAG_GRAPH ...]`
3. All input refs resolve to a known node (`kind: source` has no `inputs:`; its `path:` is checked at run time) — `[V2_DAG_GRAPH ...]`
4. Acyclic graph (cycle detection includes the offending node id)

## Project layout

A pipeline can live as a single `pipeline.dag.yaml` file (no marker required) or inside a folder with a `rime.project.yaml` marker. Project layout from the marker:

```
my-project/
├── rime.project.yaml          # marker + optional config
├── pipeline.dag.yaml          # the DAG
├── data/                      # raw data files (relative paths in DAG)
├── scripts/                   # python/r/js/sql script files
├── outputs/                   # generated outputs (gitignore this)
└── .rime/                     # cache + state (gitignore this)
```

For one-off DAGs, drop the marker; everything resolves relative to the DAG file.

## Node Kinds

`source`, `filter`, `derive`, `aggregate`, `select`, `sort`, `join`, `pivot`,
`concat`, `t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`,
`linear_regression`, `subgraph`, plus language kinds `python`, `r`,
`javascript`, and `sql`.

Each has its own reference page under [Node Reference](/rime-docs/nodes/).

## Expression DSL

`filter.expr`, `derive.expr`, `aggregate.metrics[]`, `aggregate.groupBy[]`, and `sort.by[].expr` use a small expression DSL. Column refs go in `[brackets]`; literals are plain values.

```yaml
expr: "[age] >= 18 and [status] == 'active'"
metrics:
  - "[mean_age] = [age].mean()"
  - "[median_score] = [score].median()"
```

Supported operators: arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), boolean (`and`, `or`, `not`), and a small library of column-method calls (`.mean()`, `.median()`, `.sum()`, `.count()`, `.min()`, `.max()`, `.std()`).

## Report Inclusion

Reports include every node unless you opt out:

```yaml
- id: raw_orders
  kind: source
  path: data/orders.csv
  metadata:
    report: false
```

Use this for raw source nodes and noisy intermediate staging nodes. The outputs
still exist on disk and remain available to downstream nodes.
