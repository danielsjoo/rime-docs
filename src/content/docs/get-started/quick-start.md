---
title: Quick start
description: From zero to a running Rime pipeline in under five minutes.
---

This walkthrough takes you from a fresh install to a working pipeline that filters, aggregates, and runs a Python script — all driven from a single YAML file.

## The mental model

1. **Pipeline shape goes in `pipeline.dag.yaml`** — only data flow, no presentation, no execution config. Source nodes carry their data file paths inline (`path: data/foo.csv`); script nodes reference their files via `source:`. All relative paths resolve against the directory holding the DAG.
2. **Presentation goes in `report.yaml`** — sections, markdown blocks, `table:` and `stat:` blocks that point at DAG node ids.
3. **Interpreter selection** — pass `--python-bin` / `--rscript-bin` on the CLI, or set `RIME_PYTHON_BIN` / `RIME_RSCRIPT_BIN`, or declare paths inline on the DAG via an optional `interpreters:` block.

Every node in the DAG takes tabular inputs and is configured by fields hard-coded into the node (expressions, parameters). You're tracing the flow of data through the graph.

## 30-second start

The simplest invocation: one file, one command. No project marker, no scaffolding.

```bash
rime run path/to/pipeline.dag.yaml
rime run path/to/pipeline.dag.yaml --python-bin ~/conda/envs/foo/bin/python
rime build path/to/pipeline.dag.yaml --report path/to/report.yaml
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
- `kind` (one of 14 — see [Node Reference](/concepts/nodes/))
- For `kind: source`: `path:` pointing at a CSV / JSON / NDJSON / Parquet file (loaded with type inference; parquet preserves types)
- For built-in nodes (`filter`/`derive`/`aggregate`/...): `inputs:` (array of upstream node id refs; use `nodeId.outputName` for multi-output nodes)
- For `kind: script` nodes (v2.1): `in:` map (slot name → ref string; refs may be `nodeId`, `nodeId.outputName`, or `params.<name>`)
- Type-specific fields at the top level (`expr`, `groupBy`, `metrics`, etc. — no `params:` bag)

## Step 2: declare what to render

```yaml
# report.yaml
specification_version: "1.0"
pipeline: pipeline.dag.yaml
title: "Cohort overview"
output:
  format: html
  path: outputs/run_report.html

sections:
  - heading: "Cohort summary"
    blocks:
      - markdown: |
          ## Adult cohort
          Filtered to patients aged 18 and over.

      - table:
          source: by_site
          title: "Site-level mean age"
          columns: [site, mean_age, n]
          decimals: 2
```

Three block kinds: `markdown:` (with `## headings`, **bold**, etc.), `table:` (any tabular DAG node), `stat:` (a stat-producing node — t_test, anova, correlation, chi_square, mann_whitney_u, linear_regression).

## Step 3: build

```bash
rime build pipeline.dag.yaml --report report.yaml
```

Runs the DAG, validates the report against it, renders HTML in one atomic invocation. Output lands at `outputs/run_report.html` next to the DAG file (override with `--out`).

## Adding a script node

For anything beyond the built-in transforms, use a script node. v2.1 supports four languages (`python`, `r`, `javascript`, `sql`). Each script declares its inputs as **named slots**; scalar values come from a top-level `params:` block:

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
    kind: script
    language: python
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
  kind: script
  language: sql
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

Checks DAG schema, graph integrity (no cycles, all input refs resolve), and report cross-file refs.

## Next

- [Concepts: DAG specification](/concepts/dag/)
- [Concepts: Polyglot runtime](/concepts/polyglot/)
- [Node Reference](/concepts/nodes/) — every built-in operator
