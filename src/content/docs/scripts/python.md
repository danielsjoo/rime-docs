---
title: Python language nodes
description: How Python language nodes work in Rime, including pandas inputs, outputs, environments, and plot capture.
---

A Python language node uses `kind: python`. You write a top-level `run(...)`
function, or `transform(...)` for compatibility, and Rime calls it with named
arguments from the YAML `in:` map.

## Minimum Example

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort: raw_patients
    threshold: params.threshold
```

```python
# scripts/features.py
def run(cohort, threshold):
    return cohort.assign(flag=cohort["score"] > float(threshold))
```

The slot names in YAML become Python argument names. The runtime owns input
loading, output writing, and cache bookkeeping.

## Function Signature

| YAML `in:` slot | Python value |
|---|---|
| Upstream node ref, for example `cohort: raw_patients` | `pandas.DataFrame` |
| Param ref, for example `threshold: params.threshold` | native scalar/list/dict |

The default entrypoint is `run`. `transform` is accepted for older scripts. To
use another function, set `entrypoint:` on the node.

```python
def run(cohort, lookup, threshold):
    # cohort and lookup are pandas DataFrames.
    # threshold came from params.threshold.
    ...
```

## Outputs

### Single Output

Return a pandas DataFrame, or a value pandas can turn into one:

```python
def run(orders):
    return orders[orders["total"] > 0]
```

Downstream nodes reference the default output as `filtered`.

### Multiple Outputs

Declare named outputs in YAML and return a dict with matching keys:

```yaml
- id: split
  kind: python
  source: scripts/split.py
  in: { cohort: features }
  out: { train: table, test: table }
```

```python
def run(cohort):
    train = cohort.sample(frac=0.8, random_state=42)
    test = cohort.drop(train.index)
    return {"train": train, "test": test}
```

Downstream refs are `split.train` and `split.test`.

### Non-Tabular Output

For scalars or structured objects, declare an `any` output:

```yaml
out: { result: any }
```

Use `any` for model summaries, config echoes, or compact JSON-like results.
Tables should stay as table outputs.

## Plot Capture

Matplotlib figures that are still open when your function returns are captured
into the node audit.

```python
import matplotlib.pyplot as plt

def run(cohort):
    fig, ax = plt.subplots()
    cohort.plot.scatter(x="age", y="score", ax=ax)
    ax.set_title("Age vs score")
    return cohort.describe()
```

You do not need to call a Rime-specific display function. The runner captures
open matplotlib figures after the entrypoint returns and stores them with the
node diagnostics.

## Runtime Model

Python nodes run in a warm Python runner session for the selected interpreter
during a CLI/editor run. The runner is isolated from the host Node process, but
startup is amortized across Python nodes that share the same interpreter.

Inputs and outputs move through Rime's Arrow/Parquet-backed artifact path. The
runtime converts upstream tables into pandas DataFrames before calling your
function, then persists returned tables for downstream nodes.

## Environment

Required: Python 3.11+ with `pyarrow` and `pandas`.

```bash
uv venv .venv
source .venv/bin/activate
uv pip install pyarrow pandas
rime run pipeline.dag.yaml --python-bin .venv/bin/python
```

You can also set the interpreter in the DAG:

```yaml
interpreters:
  python: .venv/bin/python
```

## See Also

- [R language nodes](/rime-docs/scripts/r/) - same slot protocol, R entrypoint
- [JavaScript language nodes](/rime-docs/scripts/javascript/) - `defineNode` and row arrays
- [SQL language nodes](/rime-docs/scripts/sql/) - DuckDB temp tables
- [Language node reference](/rime-docs/nodes/script/) - full field list
- [Polyglot runtime overview](/rime-docs/concepts/polyglot/) - cross-language design
