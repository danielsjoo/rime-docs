---
title: DuckDB single source
description: A pure-SQL Rime pipeline using DuckDB ingress mode. No Python or R required — the lightest possible setup.
---

> 🚧 **This page is a stub.** Real content is being ported from [`examples/sql-source-duckdb`](https://github.com/danielsjoo/rime/tree/main/examples/sql-source-duckdb) in the rime repo. See [EXAMPLES_PLAN.md](https://github.com/danielsjoo/rime-docs/blob/main/EXAMPLES_PLAN.md) for the porting plan.

## What this example will demonstrate

A pure-SQL Rime pipeline — no Python, no R, no JS. Just SQL nodes (and the built-in transforms) reading external files via DuckDB's file functions:

```yaml
- id: orders
  kind: sql
  source: queries/orders.sql

# queries/orders.sql:
#   SELECT * FROM 'data/orders.parquet'
#   WHERE status = 'completed'
```

When SQL is enough, this is the lightest possible Rime setup — no language interpreters to configure, no script runners to spawn.

## Use cases

- Ad-hoc warehouse reports without leaving SQL
- Quick exploration over Parquet / CSV files
- CI pipelines where Python/R interpreters add deployment overhead

## Run it locally

```bash
git clone https://github.com/danielsjoo/rime
cd rime/examples/sql-source-duckdb
rime run pipeline.dag.yaml
```
