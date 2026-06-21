---
title: Build a first pipeline
description: A hands-on workshop that creates a small Rime DAG, runs it, and turns it into a report.
---

This workshop builds the same shape as the single-file example, but starts from
an empty directory. It is intentionally small: the goal is to learn the file
layout, node syntax, run artifacts, and report flow.

## 1. Create a Project Folder

```bash
mkdir rime-penguins
cd rime-penguins
mkdir data
```

Create `data/penguins.csv`:

```csv
species,island,bill_length_mm,flipper_length_mm,body_mass_g
Adelie,Torgersen,39.1,181,3750
Adelie,Torgersen,39.5,186,3800
Adelie,Biscoe,40.3,195,3250
Gentoo,Biscoe,46.1,217,4500
Gentoo,Biscoe,50.0,222,5550
Chinstrap,Dream,46.5,192,3500
Chinstrap,Dream,50.0,196,3900
Adelie,Dream,37.2,178,3900
Adelie,Dream,41.1,182,3525
Gentoo,Biscoe,45.2,210,4300
```

## 2. Declare the DAG

Create `pipeline.dag.yaml`:

```yaml
specification_version: "2.1"

nodes:
  - id: penguins
    kind: source
    path: data/penguins.csv
    metadata:
      report: false

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

The graph is:

```text
penguins -> adelie_only -> by_island
```

`metadata.report: false` hides the raw source table from the HTML report, but
the source still runs and its output still lands on disk.

## 3. Validate

```bash
rime validate pipeline.dag.yaml
```

Validation catches:

- invalid YAML
- unknown node kinds or fields
- duplicate node IDs
- missing source files
- input references that do not resolve
- graph cycles

## 4. Run

```bash
rime run pipeline.dag.yaml
```

Rime creates:

```text
outputs/
├── manifest.json
├── penguins/
│   ├── default.parquet
│   └── default.parquet.meta.json
├── adelie_only/
│   ├── default.parquet
│   └── default.parquet.meta.json
└── by_island/
    ├── default.parquet
    └── default.parquet.meta.json
```

The final table is:

| island | mean_bill_length | mean_flipper_length | n |
|---|---:|---:|---:|
| Biscoe | 40.30 | 195.00 | 1 |
| Dream | 39.15 | 180.00 | 2 |
| Torgersen | 39.30 | 183.50 | 2 |

## 5. Build the Report

```bash
rime build pipeline.dag.yaml
```

Open:

```text
outputs/run_report.html
```

The report includes `adelie_only` and `by_island`. It does not include
`penguins`, because that source node opted out with `metadata.report: false`.

## 6. Force a Recompute

The second run should mostly hit cache:

```bash
rime run pipeline.dag.yaml
```

To recompute the graph but keep the fresh cache:

```bash
rime run pipeline.dag.yaml --no-cache-read
```

To run without reading or writing cache:

```bash
rime run pipeline.dag.yaml --lean
```

## 7. Extend the DAG

Add a `derive` node between `adelie_only` and `by_island`:

```yaml
  - id: bill_ratio
    kind: derive
    inputs: [adelie_only]
    as: bill_to_flipper
    expr: "[bill_length_mm] / [flipper_length_mm]"
```

Then point `by_island` at `bill_ratio` and add a metric:

```yaml
  - id: by_island
    kind: aggregate
    inputs: [bill_ratio]
    groupBy: ["[island]"]
    metrics:
      - "[mean_bill_length] = [bill_length_mm].mean()"
      - "[mean_flipper_length] = [flipper_length_mm].mean()"
      - "[mean_bill_to_flipper] = [bill_to_flipper].mean()"
      - "[n] = [bill_length_mm].count()"
```

Run again:

```bash
rime validate pipeline.dag.yaml
rime build pipeline.dag.yaml
```

Rime reuses unchanged upstream artifacts where the cache key still matches and
recomputes the changed branch.

## Next

- [Quick start](/rime-docs/get-started/quick-start/)
- [Concepts: DAG specification](/rime-docs/concepts/dag/)
- [Examples: DAG showcase](/rime-docs/examples/dag-showcase/)
