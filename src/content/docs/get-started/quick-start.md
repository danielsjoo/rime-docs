---
title: Quick start
description: From zero to a running Rime pipeline in under five minutes.
---

This walkthrough takes you from a fresh install to a working pipeline that filters, aggregates, and runs a Python script — all driven from a single YAML file.

## The mental model

1. **Pipeline shape goes in `pipeline.dag.yaml`** — data flow plus default report inclusion. Source nodes carry their data file paths inline (`path: data/foo.csv`); language nodes reference their files via `source:`. All relative paths resolve against the directory holding the DAG.
2. **Reports are generated from the DAG** — every node appears by default; set `metadata.report: false` to hide raw or intermediate nodes.
3. **Interpreter selection** — pass `--python-bin` / `--rscript-bin` on the CLI, or set `RIME_PYTHON_BIN` / `RIME_RSCRIPT_BIN`, or declare paths inline on the DAG via an optional `interpreters:` block.

Every node in the DAG takes tabular inputs and is configured by fields hard-coded into the node (expressions, parameters). You're tracing the flow of data through the graph.

## 30-second start

The simplest invocation: one file, one command. No project marker, no scaffolding.

```bash
rime run path/to/pipeline.dag.yaml
rime run path/to/pipeline.dag.yaml --python-bin ~/conda/envs/foo/bin/python
rime build path/to/pipeline.dag.yaml
```

The directory containing the DAG file is the root for relative paths and where `outputs/` lands.

## Step 1: declare the pipeline shape

```yaml
# pipeline.dag.yaml
specification_version: "2.1"
nodes:
  - id: patients
    kind: source
    path: data/patients.csv

  - id: adults
    kind: filter
    inputs: [patients]
    expr: "[age] >= 18"

  - id: by_site
    kind: aggregate
    inputs: [adults]
    groupBy: ["[site]"]
    metrics:
      - "[mean_age] = [age].mean()"
      - "[n] = [age].count()"
```

Every node has:

- `id` (unique)
- `kind` (one of 14 — see [Node Reference](/rime-docs/concepts/nodes/))
- For `kind: source`: `path:` pointing at a CSV / JSON / NDJSON / Parquet file (loaded with type inference; parquet preserves types)
- For built-in nodes (`filter`/`derive`/`aggregate`/...): `inputs:` (array of upstream node id refs; use `nodeId.outputName` for multi-output nodes)
- For language nodes (v2.1): `in:` map (slot name → ref string; refs may be `nodeId`, `nodeId.outputName`, or `params.<name>`)
- Type-specific fields at the top level (`expr`, `groupBy`, `metrics`, etc. — no `params:` bag)

## Step 2: choose what to render

```yaml
- id: patients
  kind: source
  path: data/patients.csv
  metadata:
    report: false
```

Reports include every node by default. Use `metadata.report: false` for raw
sources or intermediate steps that should not appear in the HTML output.

## Step 3: build

```bash
rime build pipeline.dag.yaml
```

Runs the DAG and renders HTML in one atomic invocation. Output lands at
`outputs/run_report.html` next to the DAG file (override with `--out`).

## Adding a language node

For anything beyond the built-in transforms, use a language node. v2.1 supports four languages (`python`, `r`, `javascript`, `sql`). Each script declares its inputs as **named slots**; scalar values come from a top-level `params:` block:

```yaml
specification_version: "2.1"

params:
  threshold: { type: float, default: 0.5 }

nodes:
  - id: adults
    kind: filter
    inputs: [patients]
    expr: "[age] >= 18"

  - id: features
    kind: python
    source: scripts/features.py
    in:
      adults:    adults              # node ref -> resolves to a Table
      threshold: params.threshold    # params.<name> -> resolves to a scalar
```

Your `scripts/features.py` takes the slots as named args:

```python
def run(adults, threshold):
    return adults.assign(flag=(adults["score"] > float(threshold)))
```

## Adding a SQL node

```yaml
- id: enriched
  kind: sql
  source: queries/enrich.sql
  in:
    adults: adults
    lookup: lookup
```

```sql
-- queries/enrich.sql
SELECT a.*, l.label
FROM adults a
LEFT JOIN lookup l ON a.id = l.adult_id
```

Each upstream node registers as a DuckDB temp table named after the node id.

## Validate before you build

```bash
rime validate pipeline.dag.yaml
```

Checks DAG schema and graph integrity (no cycles, all input refs resolve).

## Next

- [Concepts: DAG specification](/rime-docs/concepts/dag/)
- [Concepts: Polyglot runtime](/rime-docs/concepts/polyglot/)
- [Node Reference](/rime-docs/concepts/nodes/) — every built-in operator
