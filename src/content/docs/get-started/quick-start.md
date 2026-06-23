---
title: Quick start
description: Run the smallest complete Rime pipeline and inspect the artifacts it writes.
---

This page runs the smallest complete Rime project: one CSV, one
`pipeline.dag.yaml`, one command. It uses only core nodes, so no Python or R
interpreter setup is required.

For a slower tutorial that creates every file from scratch, see the
[first pipeline workshop](/workshops/first-pipeline/).

## Clone an Example

```bash
git clone https://github.com/danielsjoo/rime
cd rime
```

The example lives at `examples/single-file/`:

```text
examples/single-file/
├── data/
│   └── penguins.csv
└── pipeline.dag.yaml
```

## Read the DAG

```yaml
specification_version: "2.1"

nodes:
  - id: penguins
    kind: source
    path: data/penguins.csv

  - id: adelie_only
    kind: filter
    inputs: [penguins]
    expr: '[species] == "Adelie"'

  - id: by_island
    kind: aggregate
    inputs: [adelie_only]
    groupBy: ["[island]"]
    metrics:
      - "[mean_bill_length] = [bill_length_mm].mean()"
      - "[mean_flipper_length] = [flipper_length_mm].mean()"
      - "[n] = [bill_length_mm].count()"
```

What each node does:

| Node | Kind | Result |
|---|---|---|
| `penguins` | `source` | Load `data/penguins.csv`. |
| `adelie_only` | `filter` | Keep rows where `species` is `Adelie`. |
| `by_island` | `aggregate` | Summarize the Adelie rows by island. |

All relative paths resolve from the directory that contains the DAG file.

## Validate

```bash
rime validate examples/single-file/pipeline.dag.yaml
```

Validation checks YAML syntax, node schemas, input references, graph cycles, and
source paths. It does not execute any nodes.

## Run

```bash
rime run examples/single-file/pipeline.dag.yaml
```

Rime writes artifacts next to the DAG:

```text
examples/single-file/outputs/
├── manifest.json
├── penguins/
│   └── default.parquet
├── adelie_only/
│   └── default.parquet
└── by_island/
    └── default.parquet
```

The final table has three rows:

| island | mean_bill_length | mean_flipper_length | n |
|---|---:|---:|---:|
| Biscoe | 40.30 | 195.00 | 1 |
| Dream | 39.15 | 180.00 | 2 |
| Torgersen | 39.30 | 183.50 | 2 |

## Build the HTML Report

```bash
rime build examples/single-file/pipeline.dag.yaml
```

`rime build` runs the DAG and writes:

```text
examples/single-file/outputs/run_report.html
```

Open that file to inspect node status, cache state, output sizes, schemas,
preview rows, and the final aggregate output.

## Hide Noisy Nodes

Reports include every node by default. Add `metadata.report: false` to source
or staging nodes that should stay out of the HTML report:

```yaml
- id: penguins
  kind: source
  path: data/penguins.csv
  metadata:
    report: false
```

## Add a Language Node

Use a language node when a built-in node does not fit. Language nodes use a
named `in:` map instead of positional `inputs:`.

```yaml
params:
  min_mass: { type: float, default: 3500 }

nodes:
  - id: heavy_penguins
    kind: python
    source: scripts/heavy.py
    in:
      penguins: penguins
      min_mass: params.min_mass
```

```python
# scripts/heavy.py
def run(penguins, min_mass):
    return penguins[penguins["body_mass_g"] >= float(min_mass)]
```

Then run with a specific interpreter or a param override:

```bash
rime run pipeline.dag.yaml --python-bin .venv/bin/python
rime run pipeline.dag.yaml --param min_mass=3800
```

## Common Commands

| Command | Use it for |
|---|---|
| `rime validate pipeline.dag.yaml` | Check schema and graph integrity before running. |
| `rime run pipeline.dag.yaml` | Execute the DAG and persist artifacts. |
| `rime build pipeline.dag.yaml` | Execute the DAG and render HTML. |
| `rime run pipeline.dag.yaml --no-cache-read` | Force recompute while still writing fresh cache. |
| `rime run pipeline.dag.yaml --lean` | Recompute without reading or writing cache artifacts. |

## Next

- [Workshop: build a first pipeline](/workshops/first-pipeline/)
- [Concepts: DAG specification](/concepts/dag/)
- [Concepts: Polyglot runtime](/concepts/polyglot/)
- [Node Reference](/nodes/) — every built-in operator
