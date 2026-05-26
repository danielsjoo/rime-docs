---
title: Polyglot runtime
description: How Rime mixes SQL, Python, R, and JavaScript inside one DAG.
---

Rime's defining property is its polyglot runtime: a single DAG can use four languages for transforms, each with native-feeling APIs and zero glue code between them.

## The protocol in one sentence

Each script node declares **named input slots** in YAML; the runtime materializes each upstream output as a **native value** in the target language and passes it as a named function argument; the script returns either a single tabular value (default output `default`) or a map of named outputs.

Tabular handoffs use Arrow IPC. Everything is typed at the boundary.

## Languages

### Python

Minimum: 3.11. Required: `pyarrow` (data interchange). Recommended add-ons: `pandas`, `polars`, `numpy`.

```python
# scripts/features.py
def run(cohort, threshold):
    # `cohort` arrives as a pandas DataFrame
    # `threshold` arrives as whatever type matches the params declaration
    return cohort.assign(flag=(cohort["score"] > float(threshold)))
```

YAML:

```yaml
- id: features
  kind: script
  language: python
  source: scripts/features.py
  in:
    cohort:    upstream_node
    threshold: params.threshold
```

For multi-output, return a dict:

```python
def run(cohort):
    return {"train": train_df, "test": test_df}
```

### R

Minimum: R 4.0. Required: `arrow`, `jsonlite`, `tibble`.

```r
# scripts/risk_adjust.R
rime::register(
  function(cohort, threshold) {
    cohort$flag <- cohort$score > as.numeric(threshold)
    cohort
  },
  in_slots  = list(cohort = "table", threshold = "any"),
  out_slots = list(default = "table")
)
```

The `rime::register` call wires the function to the runtime's named-slot protocol.

### JavaScript

Runs in Node 22+. The runtime ships a small `defineNode` helper:

```js
// scripts/enrich.mjs
import { defineNode } from '@rimekit/runtime'

export default defineNode({
  in:  { cohort: 'table', threshold: 'any' },
  out: { default: 'table' },
  run: async ({ cohort, threshold }) => {
    return cohort.rows.map((r) => ({
      ...r,
      flag: r.score > Number(threshold)
    }))
  }
})
```

`cohort.rows` is an array of plain JS objects.

### SQL

Runs against an in-memory DuckDB. Each upstream node registers as a temp table named after its YAML slot key:

```sql
-- queries/enrich.sql
SELECT a.id, a.name, l.label
FROM cohort a
LEFT JOIN lookup l ON a.id = l.cohort_id
```

```yaml
- id: enriched
  kind: script
  language: sql
  source: queries/enrich.sql
  in:
    cohort: upstream_a
    lookup: upstream_b
```

**Ingress mode** — a SQL node with no `in:` reads external files directly via DuckDB's file functions:

```sql
SELECT * FROM 'data/orders.parquet'
```

This is the fastest path to load Parquet into a DAG.

## Pointing at a conda env or system R

The CLI resolves Python and R via env vars:

```bash
export RIME_PYTHON_BIN=/path/to/conda/envs/myenv/bin/python
export RIME_RSCRIPT_BIN=$(which Rscript)
rime build pipeline.dag.yaml
```

CLI flags override env: `--python-bin` and `--rscript-bin`. When neither is set, defaults are `python3` and `Rscript` on PATH.

You can also declare interpreters inline in the DAG (handy for one-machine pipelines, ignored if env / flags override):

```yaml
specification_version: "2.1"
interpreters:
  python: /Users/me/conda/envs/foo/bin/python
  r:      /Library/Frameworks/R.framework/Resources/bin/Rscript
nodes: [...]
```

## Per-call subprocess model

Each script-node run spawns a fresh subprocess (Python / R / Node). There's no warm pool, no shared interpreter state across nodes. This trades raw throughput for isolation and reproducibility.

Heavy-compute paths that need warm state should batch their work inside a single script node.

## Captured side effects

The runtime captures, per node:

- **stdout** — `print()` / `cat()` output, available under `auditTrail.get(nodeId).stats.captured_stdout`
- **matplotlib figures** (Python) — call `rime_runner.display_figure(fig)` to embed a PNG in the audit
- **error tracebacks** — full subprocess stderr on non-zero exit

These show up in the rendered HTML report when you target a node from a `markdown:` or `stat:` block.
