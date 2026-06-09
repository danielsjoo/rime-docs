---
title: Single-file pipeline
description: The smallest possible Rime pipeline.
---

A minimal DAG-file-mode pipeline lives under [`examples/single-file/`](https://github.com/rimekit/rime/tree/main/examples/single-file). One YAML, one CSV, one command.

## What it does

Loads penguin observations, filters to the Adelie species, groups by island, and reports mean bill length, mean flipper length, and count per group.

## Layout

```
examples/single-file/
├── pipeline.dag.yaml          # the entire pipeline
└── data/
    └── penguins.csv           # ~340 rows of measurements
```

## The DAG

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

## Running it

```bash
rime run examples/single-file/pipeline.dag.yaml
```

Outputs land under `examples/single-file/outputs/by_island/default.parquet`.

## Why start here

No language nodes, no Python / R interpreters required, no `report.yaml`. This is the smallest amount of Rime that does something interesting — useful for verifying your install or as the seed of a larger pipeline you grow into.
