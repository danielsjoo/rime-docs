---
title: SQL language nodes
description: How SQL language nodes work in Rime — DuckDB execution, upstream tables as temp views, ingress mode for reading external files directly.
---

A SQL language node uses `kind: sql`. It runs against an in-memory DuckDB instance. Upstream node outputs are registered as **temp tables** named after the YAML `in:` slot key; you write a `SELECT` and the result becomes the node's output.

## Minimum example

```yaml
- id: enriched
  kind: sql
  source: queries/enrich.sql
  in:
    orders:    upstream_orders
    customers: upstream_customers
```

```sql
-- queries/enrich.sql
SELECT
  o.id          AS order_id,
  o.amount,
  c.name        AS customer_name,
  c.tier
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'completed'
```

The `orders` and `customers` table names in the SQL come **from the YAML `in:` keys**, not from upstream node IDs. Renaming a slot renames the table in the SQL.

## Function signature (kind of)

SQL doesn't have functions in the JS/Python sense — but the slot protocol still applies. Each YAML `in:` slot becomes a query-scoped temp table.

| YAML `in:` slot | What it is in SQL |
|---|---|
| Upstream node ID (e.g. `orders: upstream_orders`) | **Temp table named `orders`**, schema mirrors the upstream Parquet |
| `params.<name>` | A query parameter you can reference with `?` or `$name` (DuckDB prepared-statement syntax) |

Multi-input joins are the most common pattern:

```yaml
in:
  left:  customers
  right: orders
```

```sql
SELECT * FROM left INNER JOIN right ON left.id = right.customer_id
```

## Outputs

A SQL node produces **one output** (named `default`): the row-set of the final query.

```sql
-- This whole query is the node's output
SELECT site, COUNT(*) AS n
FROM enriched_orders
GROUP BY site
```

If you need multiple intermediate steps, use CTEs:

```sql
WITH active AS (
  SELECT * FROM orders WHERE status = 'active'
),
by_site AS (
  SELECT site, COUNT(*) AS n FROM active GROUP BY site
)
SELECT * FROM by_site WHERE n > 10
```

For **multi-output** scenarios, split into separate SQL nodes — each one produces one output, and downstream nodes pick the one they need.

## Ingress mode — read files directly without a `source` node

A SQL node with **no `in:` slot** is in "ingress mode": it can read external files directly via DuckDB's file functions (`read_parquet`, `read_csv`, `read_json`).

```yaml
- id: orders
  kind: sql
  source: queries/orders.sql
```

```sql
-- queries/orders.sql
SELECT *
FROM read_parquet('data/orders.parquet')
WHERE status = 'completed'
```

Ingress mode is the **fastest path** to load a Parquet file into a DAG — no `source` node round-trip, no Arrow round-trip, DuckDB reads the Parquet directly with its built-in reader (which is excellent).

This is also the recommended pattern for the `examples/sql-source-duckdb` example — pure SQL pipelines that never leave the SQL world.

## What happens under the hood

SQL nodes share the runtime's DuckDB instance (warm — DuckDB stays loaded across SQL nodes within a run):

1. **Inputs are attached, not copied.** Each upstream output is registered as a DuckDB view backed by the Parquet/Arrow file on disk. DuckDB's vectorized executor reads columns lazily — you don't pay for columns your query doesn't reference.
2. **Your query executes against DuckDB's vectorized engine.** This is the same engine used by Polars, Motherduck, and a growing list of analytics tools. Generally faster than pandas for joins, group-bys, and aggregations.
3. **The result is materialized as Arrow.** DuckDB exports the query result as an Arrow Table, which is then written as Parquet for downstream nodes.
4. **Errors include the offending SQL line.** Syntax and runtime errors surface with line numbers in the run audit.

Because DuckDB stays warm across SQL nodes in one run, SQL nodes have very low
startup overhead. Python and R also use warm runner sessions, but they still
pay for language-specific imports and data conversion inside those sessions.

## When to use SQL

- **Joins and aggregations** — DuckDB beats pandas, polars, and definitely R for these.
- **Reading external files** — `read_parquet`, `read_csv`, `read_json` are first-class.
- **Pre-shaping data for downstream Python/R language nodes** — the join/filter/aggregate in SQL, then hand off a small table for ML/stats.
- **Pure-SQL pipelines** — the `examples/sql-only` example shows what's possible without any other language.

## DuckDB extensions

The runtime preloads `httpfs` (read from URLs), `parquet`, `arrow`, and `json`. Other extensions can be enabled per-query:

```sql
INSTALL spatial;
LOAD spatial;
SELECT * FROM ST_Read('data/parcels.geojson');
```

## Environment

No interpreter setup needed — DuckDB is bundled with the Rime runtime. The minimum DuckDB version is whatever the `@duckdb/node-api` dependency in `@rimekit/runtime`'s `package.json` pins.

## See also

- [Python language nodes](/rime-docs/scripts/python/) — for ML and statistical work
- [R language nodes](/rime-docs/scripts/r/) — for tidyverse-style analysis
- [JavaScript language nodes](/rime-docs/scripts/javascript/) — for external API fetches
- [Language node reference](/rime-docs/nodes/script/) — full field list
- [Polyglot runtime overview](/rime-docs/concepts/polyglot/) — the cross-cutting design
- [DuckDB documentation](https://duckdb.org/docs/) — the SQL dialect, file functions, extensions
