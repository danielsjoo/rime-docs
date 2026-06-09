---
title: Python language nodes
description: How Python language nodes work in Rime — function signature, pandas DataFrames in, dataframes out, Arrow IPC under the hood, constant-time cast.
---

A Python language node uses `kind: python`. You write a function; the runtime hands it pandas DataFrames as named arguments and captures whatever you return.

## Minimum example

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort: raw_patients     # upstream node id
    threshold: params.threshold
```

```python
# scripts/features.py
def run(cohort, threshold):
    return cohort.assign(flag=cohort["score"] > float(threshold))
```

That's the whole protocol: declare your inputs in the YAML's `in:` map, declare a `run(...)` function with **arguments named to match the slots**, return a DataFrame.

## Function signature

The runtime calls `run(**slots)` — your parameter names must match the keys in `in:`.

> The default entrypoint is `run` (or `transform`, which the Editor emits — both
> are accepted). To use a different name, set `entrypoint:` on the node.

| YAML `in:` slot | Native Python type |
|---|---|
| Upstream node ID (e.g. `cohort: raw_patients`) | **`pandas.DataFrame`** |
| `params.<name>` (e.g. `threshold: params.threshold`) | Native scalar (`int`, `float`, `str`, `bool`, `list`, `dict`) |

```python
def run(cohort, lookup, threshold):
    # cohort: pandas.DataFrame
    # lookup: pandas.DataFrame
    # threshold: float (from params.threshold)
    ...
```

There is **no `read_csv()` at the top** and **no `to_parquet()` at the bottom**. The runtime owns I/O.

## Outputs

### Single output (default)

Return a `pandas.DataFrame` (or anything pandas can construct one from — list of dicts, numpy array, polars frame). The runtime writes it to the node's `default` output:

```python
def run(orders):
    return orders[orders["total"] > 0]
```

```yaml
- id: filtered
  kind: python
  source: scripts/filter.py
  in: { orders: raw_orders }
# Downstream refers to this as `filtered` (the default output)
```

### Multiple named outputs

Return a `dict` of DataFrames. Each key becomes a named output:

```python
def run(cohort):
    return {
        "train": cohort.sample(frac=0.8, random_state=42),
        "test":  cohort.drop(cohort.sample(frac=0.8, random_state=42).index),
    }
```

The YAML node needs to declare the outputs it exposes:

```yaml
- id: split
  kind: python
  source: scripts/split.py
  in:   { cohort: features }
  out:  { train: table, test: table }   # required for multi-output nodes
```

Downstream nodes reference them by name: `split.train`, `split.test`.

### Non-tabular outputs

For nodes that emit scalars or structured JSON (e.g. a model summary, a list of clusters), declare the output type as `any`:

```yaml
out: { result: any }
```

The runtime serializes whatever you return as JSON. Use this sparingly — tabular outputs flow through Arrow IPC and stay zero-copy; `any` outputs hit JSON encode/decode.

## What happens under the hood

When the runtime calls your `run(...)`:

1. **Inputs are materialized as Arrow tables on disk.** Each upstream tabular output is written as Parquet (or kept as Arrow IPC for hot paths) in the project's `outputs/` directory, content-addressed by `hash(source_code + inputs)`.
2. **Arrow → pandas is constant-time.** When your function is called, the runtime memory-maps the Arrow buffer and constructs the pandas DataFrame via `pyarrow.Table.to_pandas(...)`. For columnar data this is **zero-copy for most numeric and string types** (the underlying Arrow buffer is shared with NumPy/pandas via Python's buffer protocol). Wall-clock cost: microseconds for typical analytical column widths, independent of row count.
3. **Your function runs** in a subprocess (`python3` interpreter resolved per `RIME_PYTHON_BIN` or the project's `interpreters:` block).
4. **Outputs cross the boundary the same way.** Your returned DataFrame is converted via `pyarrow.Table.from_pandas(...)` and written to Parquet for the next node — also zero-copy for compatible types.
5. **`auditTrail` captures `stdout`, exceptions, and any matplotlib figures** you display via `rime_runner.display_figure(fig)`.

## Capturing plots

```python
import matplotlib.pyplot as plt
import rime_runner

def run(cohort):
    fig, ax = plt.subplots()
    cohort.plot.scatter(x="age", y="score", ax=ax)
    rime_runner.display_figure(fig)
    return cohort.describe()
```

The figure is captured as a PNG in the run's audit trail and surfaces in the rendered HTML report when you target this node from a `plot:` block.

## Subprocess model

Each Python node run spawns a fresh Python subprocess — no warm interpreter pool, no module cache shared across nodes. Trade-off: cold-start cost (~200ms per Python node) for isolation and reproducibility. Heavy work that needs warm state (loaded ML model, big initialized pipeline) should fit inside **one** language node.

## Environment

Required: Python 3.11+ with `pyarrow` and `pandas`. Recommended add-ons: `polars`, `numpy`, `scipy`, `scikit-learn`, `umap-learn` (for the cars-emissions example).

Point Rime at a specific interpreter:

```bash
export RIME_PYTHON_BIN=/path/to/conda/envs/myenv/bin/python
rime run pipeline.dag.yaml
```

Or inline in the DAG:

```yaml
interpreters:
  python: /path/to/conda/envs/myenv/bin/python
```

## See also

- [R language nodes](/scripts/r/) — same protocol, different native type (`tibble`)
- [JavaScript language nodes](/scripts/javascript/) — runs in Node 22+, in-process
- [SQL language nodes](/scripts/sql/) — runs against DuckDB
- [Language node reference](/nodes/script/) — full field list
- [Polyglot runtime overview](/concepts/polyglot/) — the cross-cutting design
