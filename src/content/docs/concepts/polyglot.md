---
title: Polyglot runtime
description: How Rime mixes SQL, Python, R, and JavaScript inside one DAG.
---

Rime's polyglot runtime lets one DAG use the language that fits each step:
DuckDB for joins and ingress, Python or R for analysis code, JavaScript for
small async or product-adjacent transforms, and core nodes for readable YAML
formulas.

## The Protocol In One Sentence

Each language node declares named input slots in YAML. The runtime resolves each
slot to an upstream output or param, materializes it in the target language, and
calls the script entrypoint with names that match the YAML.

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort: clean_patients
    threshold: params.threshold
```

```python
def run(cohort, threshold):
    ...
```

Scripts return one table, a named map of tables, or an `any` value for JSON-like
objects. Tabular handoffs use the runtime's Arrow/Parquet-backed artifact path
so languages do not need to write their own CSV or JSON glue.

## Runtime Models

| Language | Native input shape | Runtime model | Best for |
|---|---|---|---|
| **SQL** | DuckDB temp tables named by `in:` slots | Warm DuckDB executor inside the run | ingress, joins, grouping, pre-shaping large files |
| **Python** | `pandas.DataFrame` plus native scalar params | Warm Python runner session per interpreter/env during a run | ML, scientific Python, matplotlib diagnostics |
| **R** | `data.frame`/tibble plus native scalar params | Warm R runner session per interpreter/env during a run | tidy analysis, statistical routines, ggplot diagnostics |
| **JavaScript** | `{ rows: [...] }` objects plus scalar params | Node child process per JS node | API fetches, light reshaping, app-adjacent logic |

Python and R are isolated from the host process but no longer pay a fresh
interpreter startup for every node. JavaScript currently uses a short-lived Node
child process per node. SQL shares the DuckDB executor across SQL nodes within a
run.

## Per-Language Pages

- **[SQL language nodes](/rime-docs/scripts/sql/)** - DuckDB temp tables and ingress mode
- **[Python language nodes](/rime-docs/scripts/python/)** - pandas DataFrame entrypoints and matplotlib capture
- **[R language nodes](/rime-docs/scripts/r/)** - `run`/`transform` functions, data.frames, and plot-return capture
- **[JavaScript language nodes](/rime-docs/scripts/javascript/)** - `defineNode`, row arrays, async support
- **[HTML output](/rime-docs/scripts/html/)** - custom HTML artifacts returned from a JavaScript node

## Interpreter Resolution

The CLI resolves Python and R in this order:

1. CLI flags: `--python-bin` / `--rscript-bin`
2. the DAG `interpreters:` block
3. env vars: `RIME_PYTHON_BIN` / `RIME_RSCRIPT_BIN`
4. defaults on `PATH`: `python3` / `Rscript`

```yaml
specification_version: "2.1"
interpreters:
  python: .venv/bin/python
  r: /usr/local/bin/Rscript
nodes: [...]
```

Editor projects use the same idea, but the interpreter path is selected in the
desktop UI and passed to the runtime automatically before a run.

## Captured Side Effects

The runtime captures useful diagnostics per node:

- `stdout` from `print()`, `cat()`, and `console.log()`
- Python exceptions and R/JS error stacks
- Python matplotlib figures that are still open when the entrypoint returns
- R plot candidates returned from the entrypoint, such as ggplot objects or recorded plots
- node warnings from built-in statistical checks

These diagnostics appear in the HTML report and editor inspector so review is
not limited to the final table.

## Design Tradeoffs

Rime optimizes for reproducible node boundaries rather than hiding everything in
one process. That means:

- user code does not decide file formats or output paths
- cache keys include script/source content and upstream output digests
- each language can fail with its own useful traceback
- moving a transform from Python to R or SQL keeps the DAG contract stable

Use core nodes or SQL for small tabular transformations. Use Python/R/JS nodes
when the code is clearer in a real programming language or needs that ecosystem.
