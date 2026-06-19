---
title: Two ways to use Rime
description: How core nodes and script nodes fit together in a Rime DAG.
---

Rime has two complementary ways to describe data work:

1. **Core nodes** for common table operations using Rime's built-in YAML grammar.
2. **Script nodes** for custom logic in Python, R, JavaScript, or SQL.

Both live in the same `pipeline.dag.yaml`. That file declares where data comes from, how each transform depends on earlier outputs, and what each step returns. When you run it, Rime validates the graph, computes cache keys, executes only what changed, writes outputs, and records logs.

## Core nodes

Core nodes are the quickest way to express routine data shaping without choosing a programming language. They cover the operations most analyses repeat: load a source, filter rows, derive columns, aggregate, join, pivot, select, sort, concatenate, and run statistical checks.

The syntax is intentionally close to spreadsheet formulas. Column references are wrapped in brackets:

```yaml
nodes:
  - id: line_items
    kind: source
    path: data/orders.csv

  - id: paid_items
    kind: filter
    input: line_items
    where: "[status] == 'paid'"

  - id: enriched_items
    kind: derive
    input: paid_items
    columns:
      revenue: "[unit_price] * [quantity]"
      order_year: "year([ordered_at])"

  - id: review_columns
    kind: select
    input: enriched_items
    columns: [order_id, store_id, order_year, revenue]
```

This is language agnostic. You do not need pandas, dplyr, JavaScript arrays, or SQL just to say "keep paid rows," "make these new columns," or "carry forward these fields." The YAML is the contract, and the runtime decides how to execute it.

What to expect when you make this file:

- `source` nodes read files into named tables.
- Transform nodes point at earlier node IDs with `input` or named input maps.
- Formula strings operate on columns from the input table.
- Each node emits a named output that downstream nodes can reference.
- `rime validate pipeline.dag.yaml` catches schema and graph mistakes before a run.
- `rime run pipeline.dag.yaml` writes node outputs under `outputs/` and reuses cached work when inputs and node definitions have not changed.

Core nodes are usually the right first move when the transformation can be described as table algebra. They keep the pipeline readable for reviewers who may not know the language you would otherwise have written.

## Script nodes

Script nodes are for everything that needs a real language: API clients, custom parsing, model inference, specialized statistical packages, unusual joins, plotting helpers, or project-specific business logic.

In a script node, the YAML still declares the node and its dependencies, but the implementation lives in a script file:

```yaml
nodes:
  - id: customers
    kind: source
    path: data/customers.csv

  - id: scored_customers
    kind: python
    source: scripts/score_customers.py
    in:
      customers: customers
    out:
      scored: table
```

The Python file exports the function Rime should run:

```python
import pandas as pd

def run(customers: pd.DataFrame) -> pd.DataFrame:
    scored = customers.copy()
    scored["risk_score"] = (
        scored["late_payments"] * 2 + scored["open_balance"] / 1000
    )
    return scored
```

Rime interprets that script as a node function. The engine reads the declared inputs, materializes them in the native shape for the language, calls the function, captures the return value, validates the declared outputs, and makes those outputs available to the rest of the DAG.

The same idea applies across languages:

- **SQL** nodes run in DuckDB with upstream tables available as named views.
- **Python** nodes receive pandas DataFrames and return DataFrames or declared objects.
- **R** nodes receive data frames or tibbles and return data frames.
- **JavaScript** nodes use Rime's `defineNode` helper to declare inputs, outputs, and a `run` function.

Script nodes keep custom code focused on computation. You should not need to write intermediate Parquet files, invent file naming conventions, pass paths through environment variables, or manually wire logs into downstream steps. That work belongs to the Rime runtime.

## Mixing both

Most useful pipelines mix the two styles. Start with core nodes for the readable, reviewable table operations. Add script nodes where a language earns its place.

```yaml
nodes:
  - id: orders
    kind: source
    path: data/orders.csv

  - id: clean_orders
    kind: filter
    input: orders
    where: "[status] != 'cancelled'"

  - id: model_inputs
    kind: select
    input: clean_orders
    columns: [customer_id, ordered_at, subtotal, discount, region]

  - id: predictions
    kind: python
    source: scripts/predict_churn.py
    in:
      orders: model_inputs
    out:
      scored_customers: table
```

That is the main Rime habit: declare the data flow in one file, write custom functions only where they clarify the work, and let the runtime handle the execution machinery.
