---
title: DAG specification
description: The shape of pipeline.dag.yaml.
---

The shape of `pipeline.dag.yaml`. For per-node field reference see the [Node Reference](/concepts/nodes/) section.

## Top level

```yaml
specification_version: "2.1"   # required, hard cut from 1.x
nodes:                          # required, >=1, acyclic, unique ids
  - ...
```

The DAG describes pipeline shape and default report inclusion. Execution config lives in `runtime.yaml` (or inline `interpreters:` block). Data file paths live inline on source nodes (`path: data/foo.csv`). Reports include every node unless `metadata.report: false` is set.

## Node shape (shared)

```yaml
- id: my_node                   # identifier-shaped, unique within DAG
  kind: <discriminator>         # one of 14
  inputs: [upstream_id, ...]    # optional; refs are nodeId or nodeId.outputName
  output: [out_a, out_b]        # optional; multi-output declaration
  metadata:                     # optional; closed schema
    label: "Friendly label"
    group: "ingest"
    report: false                # optional; omit or true to include in auto-report
    visual_stats: ["row_count"]
    cache: false                # boolean | { policy: ttl, seconds: N }
```

**Kind-specific fields** are at the top level on the node — no `params:` bag, no `passthrough()`. The schema is a `z.discriminatedUnion('kind', [...])` — each kind declares exactly the fields it accepts; unknown fields are rejected.

## Input ref grammar

Wherever a node references an upstream output:

- `node_id` — the default output of the named node
- `node_id.output_name` — a named output of a multi-output node

Used in `inputs:`, `subgraph.bindings`, and `subgraph.outputs`.

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

## The 14 v2 kinds

`source`, `filter`, `derive`, `aggregate`, `select`, `sort`, `join`, `pivot`, `concat`, `t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`, `linear_regression`, `subgraph`, `script`.

Each has its own per-field reference page under [Node Reference](/concepts/nodes/).

## Expression DSL

`filter.expr`, `derive.expr`, `aggregate.metrics[]`, `aggregate.groupBy[]`, and `sort.by[].expr` use a small expression DSL. Column refs go in `[brackets]`; literals are plain values.

```yaml
expr: "[age] >= 18 and [status] == 'active'"
metrics:
  - "[mean_age] = [age].mean()"
  - "[median_score] = [score].median()"
```

Supported operators: arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`), boolean (`and`, `or`, `not`), and a small library of column-method calls (`.mean()`, `.median()`, `.sum()`, `.count()`, `.min()`, `.max()`, `.std()`).
