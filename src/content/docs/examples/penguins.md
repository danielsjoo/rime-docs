---
title: Penguin classifier
description: A small Palmer penguins DAG for learning source, filter, aggregate, and report output.
---

This example teaches the core-node path with the Palmer penguins data. It is
small enough to read in one sitting and still shows the essential DAG pattern:
source data, narrow the cohort, summarize the result, then build a report.

## What it Teaches

- `source` loads a CSV with inferred column types.
- `filter` keeps one species.
- `aggregate` groups the filtered rows by island.
- `rime build` renders the node outputs as an HTML report.

## Project Layout

Use the checked-in single-file example:

```text
examples/single-file/
├── data/
│   └── penguins.csv
└── pipeline.dag.yaml
```

The fixture-level penguin parity test under
`packages/core/test/fixtures/experiments/penguin/` uses the same idea in its
smallest form: `penguins_source -> adelie_only`.

## DAG

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

## Run It

```bash
git clone https://github.com/danielsjoo/rime
cd rime
rime validate examples/single-file/pipeline.dag.yaml
rime run examples/single-file/pipeline.dag.yaml
rime build examples/single-file/pipeline.dag.yaml
```

## Expected Output

`by_island/default.parquet` contains:

| island | mean_bill_length | mean_flipper_length | n |
|---|---:|---:|---:|
| Biscoe | 40.30 | 195.00 | 1 |
| Dream | 39.15 | 180.00 | 2 |
| Torgersen | 39.30 | 183.50 | 2 |

## Extend It

After the first run, try these small edits:

- Add `metadata.report: false` to the raw `penguins` source so only the filtered
  and aggregate nodes appear in the report.
- Add a `derive` node before `by_island` to compute a simple ratio:

```yaml
- id: bill_to_flipper
  kind: derive
  inputs: [adelie_only]
  as: bill_to_flipper
  expr: "[bill_length_mm] / [flipper_length_mm]"
```

- Change the aggregate metrics to summarize the new column:

```yaml
metrics:
  - "[mean_ratio] = [bill_to_flipper].mean()"
  - "[n] = [bill_to_flipper].count()"
```
