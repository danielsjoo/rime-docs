---
title: Nodes
description: A node in Rime is a function over dataframes — not a job that wires I/O. This page is the conceptual tour.
---

## Nodes are functions, not jobs

A node in Rime is a **function over dataframes**.

You write what the function computes — the body. Rime's runtime owns everything else: reading the inputs, materializing them into a native value (pandas DataFrame, R tibble, DuckDB table, JS object array), running your code, capturing the return value, content-addressing it, caching it, and handing it to the next node.

You never write `read_csv()` at the top of a node. You never write `to_parquet()` at the bottom. The runtime does both. Your function signature *is* the contract.

## How that differs from Airflow / Prefect / Dagster

The workflow orchestrators in the ETL world (Airflow, Prefect, Dagster) treat each step as a **task**: a Python function that reads from somewhere, transforms, and writes somewhere else. The function body is responsible for its own I/O. Tasks coordinate by writing artifacts that downstream tasks happen to read — the side effect *is* the contract.

Rime inverts this. Side effects are the runtime's job; functions just compute.

| In Airflow / Prefect / Dagster | In Rime |
|---|---|
| Task reads from S3, writes to S3 | Function takes a dataframe, returns a dataframe |
| Each task owns its own I/O | Runtime owns I/O |
| Coordination via storage paths | Coordination via typed dataframe ports |
| Reproducibility requires hand-rolled idempotency | Caching is automatic (content-addressed) |
| Multi-language = orchestrating subprocess calls | Multi-language = `kind: r` in YAML; dataframes cross via Arrow IPC |
| You write the boilerplate | The runtime owns the boilerplate |

This is the same intuition behind dbt's "you write the SELECT, we handle materialization" — extended past SQL into Python, R, and JavaScript.

## The smallest possible example

```python
# scripts/cohort.py
def run(patients):
    # `patients` arrives as a pandas DataFrame.
    # You did not open a file. You did not pick a serializer.
    return patients[patients["age"] >= 18]
```

```yaml
- id: cohort
  kind: python
  source: scripts/cohort.py
  in:
    patients: raw_patients   # upstream node ID
```

That's the whole node. The runtime:

1. Reads the upstream `raw_patients` output from disk (or cache),
2. Decodes it as a pandas DataFrame,
3. Calls `run(patients=<the dataframe>)`,
4. Captures the returned dataframe,
5. Hashes the `(source code + inputs)` pair into a content address,
6. Writes the result to `outputs/cohort/default.parquet`,
7. Makes it available to any downstream node that references `cohort`.

Switch `kind: python` to `kind: r` and write the same function in R — same protocol, same caching, no glue code between them.

## Built-in node kinds

Most pipelines don't even need to write a custom function for common shapes. Rime ships 14 built-in kinds that cover the things you'd otherwise re-write every project:

### Source
| Kind | What it does |
|---|---|
| `source` | Read a CSV / JSON / NDJSON / Parquet file into a tabular value |

```yaml
- id: patients
  kind: source
  path: data/patients.csv
```

### Single-input transforms
| Kind | What it does |
|---|---|
| `filter` | Keep rows matching a boolean expression |
| `derive` | Add a computed column |
| `select` | Keep specific columns |
| `sort` | Order rows by one or more expressions |
| `aggregate` | Group + reduce, with named metrics |

### Multi-input combinators
| Kind | What it does |
|---|---|
| `join` | Two-input inner / left join on column keys |
| `concat` | Stack tables row-wise with a label column |
| `pivot` | Wide-format aggregation |

### Statistical terminals
These return a small JSON-shaped result (test statistic, p-value, etc.) rather than a table. The auto-report renders them as stat-style key-value output cells.

| Kind | What it does |
|---|---|
| `t_test` | Welch / equal-variance two-sample t-test |
| `anova` | One-way ANOVA across N groups |
| `mann_whitney_u` | Non-parametric two-sample test |
| `chi_square` | Categorical independence test |
| `correlation` | Pearson / Spearman correlation between two columns |
| `linear_regression` | Single-feature OLS, optional train/test split |

### Composition
| Kind | What it does |
|---|---|
| `subgraph` | Embed an external `.dag.yaml` file with named bindings + outputs |

Subgraphs are opaque from the outside; their `bindings:` map outer node refs to inner slot names, and their `outputs:` map exposed names to inner refs.

## The language node — the escape hatch

Anything you can't express with the built-ins is a language node. Same functional contract — you write a function, declare its inputs as **named slots**, return a dataframe (or a dict of named dataframes):

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort:    upstream_node      # dataframe slot
    threshold: params.threshold   # scalar slot
```

Native values per language: pandas DataFrame (Python), tibble (R), Arrow Table or row array (JS), temp table (SQL). See [Polyglot runtime](/concepts/polyglot/) for the per-language details.

## Metadata (optional, all kinds)

```yaml
metadata:
  label: "Friendly node label"      # editor display
  group: "feature_engineering"      # editor grouping
  visual_stats: ["row_count"]       # engine emits these on each run
  cache: false                      # boolean or { policy: ttl, seconds: N }
```

## What this buys you

- **Move scripts between languages without rewriting glue.** Switch `kind: python` to `kind: r`; the function signature stays the same.
- **No serialization decisions in user code.** Arrow IPC and Parquet are runtime concerns, not yours.
- **Caching is automatic.** Change a script — only it and its downstream re-run. Change an input — same.
- **Reproducibility is a side effect of the model, not extra work.** The cache key is `hash(source + inputs)`; same key = same result, every time.

Per-kind field reference lives under [Node Reference](/nodes/) in the sidebar.
