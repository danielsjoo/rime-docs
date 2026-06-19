---
title: DuckDB single source
description: A pure-SQL Rime pipeline using DuckDB ingress mode. No Python or R required — the lightest possible setup.
---

A SQL node with no `in:` slots can be an ingress node. DuckDB reads files or
URLs directly, and the query result becomes the node output. This is the
lightest Rime setup: no Python, no R, no JavaScript, and often no separate
`source` node.

The checked-in `examples/sql-source-duckdb` fixture shows the older v1 shape.
The v2.1 pattern below is the same idea expressed with current `kind: sql`
syntax.

## What it Teaches

- Ingress SQL reads external data with DuckDB functions.
- Downstream SQL nodes read upstream tables through named slots.
- Pure-SQL DAGs still get Rime caching, artifacts, validation, and reports.

## Minimal v2.1 DAG

```yaml
specification_version: "2.1"

nodes:
  - id: cars
    kind: sql
    source: queries/cars.sql

  - id: by_origin
    kind: sql
    in:
      cars: cars
    source: queries/by_origin.sql
```

`queries/cars.sql`:

```sql
SELECT
  CAST(Name AS VARCHAR) AS name,
  CAST(Miles_per_Gallon AS DOUBLE) AS mpg,
  CAST(Cylinders AS INTEGER) AS cylinders,
  CAST(Origin AS VARCHAR) AS origin
FROM read_json_auto(
  'https://raw.githubusercontent.com/vega/vega-datasets/main/data/cars.json'
)
WHERE Miles_per_Gallon IS NOT NULL
```

`queries/by_origin.sql`:

```sql
SELECT
  origin,
  COUNT(*) AS n,
  AVG(mpg) AS mean_mpg,
  MIN(mpg) AS min_mpg,
  MAX(mpg) AS max_mpg
FROM cars
GROUP BY origin
ORDER BY mean_mpg DESC
```

The `cars` table name in `by_origin.sql` comes from the YAML slot key:

```yaml
in:
  cars: cars
```

## Use cases

- Ad-hoc warehouse reports without leaving SQL
- Quick exploration over Parquet / CSV files
- CI pipelines where Python/R interpreters add deployment overhead
- Pre-shaping large files before a smaller Python/R analysis node

## Run It

Copy the snippets above into a new folder:

```text
sql-only/
├── pipeline.dag.yaml
└── queries/
    ├── cars.sql
    └── by_origin.sql
```

Then run:

```bash
rime run pipeline.dag.yaml
rime build pipeline.dag.yaml
```

If you are running the older checked-in fixture as-is, use the migration guide
or migrate it to the v2.1 shape above first.

## Notes

- DuckDB is bundled with the Rime runtime.
- SQL nodes have one default output. Use multiple SQL nodes for multiple
  publishable intermediate tables.
- Ingress SQL works well for Parquet, CSV, JSON, and remote files supported by
  DuckDB extensions.
