---
title: What is Rime?
description: A high-level overview of Rime — what it is, what it isn't, who it's for. (TL;DR — open the Rime Editor and you're 80% of the way there.)
---

## TL;DR — two ways to use Rime

Rime has two complementary modes:

1. **Core nodes** — use built-in nodes for simple data analysis: filter rows, derive columns, aggregate, join, pivot, select, sort, run statistical tests, and inspect outputs. Rime gives you automatic logging, content-addressed caching, assumption/statistical testing, Excel-like expressions, data diffs, DAG visualization, no-code authoring in [Rime Editor](/rime-docs/editor/overview/), and an HTML report.
2. **Script nodes** — define functions in Python, R, JavaScript, or SQL for data retrieval or transformation. You write the function signature and body; Rime handles dataframe I/O, serialization, cache keys, artifacts, stdout, figures, and downstream wiring.

Most projects use both: core nodes for the ordinary data-shaping work, scripts for the parts that need a real language.

## What Rime is

Rime is a workflow system for authoring **polyglot data pipelines** and turning their outputs into **publishable narratives**.

A pipeline is a DAG (directed acyclic graph) of typed transforms. Each node is one of:

- A **core node** — `filter`, `aggregate`, `join`, `pivot`, `sort`, `select`, `derive`, `concat`, or one of six statistical tests (`t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`, `linear_regression`). The runtime ships these; you don't write code.
- A **language node** in Python, R, JavaScript, or SQL — for anything the core nodes don't cover. You write a function; the runtime owns I/O, serialization, and language boundaries. See the [per-language script pages](/rime-docs/scripts/python/).

The DAG runs, outputs are content-addressed and cached, and `rime build` renders the results as an HTML document with node-level status, output previews, stat callouts, stdout, and figures.

## Two ways to author the same DAG

| | Rime Editor | YAML + CLI |
|---|---|---|
| **For** | Most users, especially first-time | Power users, CI pipelines, vim people |
| **Author** | Drag-drop in a top-down DAG canvas | Hand-edit `pipeline.dag.yaml` |
| **Run** | Click "Run" — live data preview at each node | `rime run pipeline.dag.yaml` |
| **Inspect** | Inline tables, stats, plot previews | Open `outputs/` directory |
| **Share** | Send the `.dag.yaml` (it's portable) | Send the `.dag.yaml` |

Both produce the same artifact. Open a project authored in the Editor with the CLI — runs identically. Open a hand-written YAML in the Editor — fully editable in the canvas.

## What Rime is not

- **Not an orchestrator** — there's no scheduler, no cloud runner, no retry-on-failure. Use Airflow / Prefect / Dagster for those concerns.
- **Not a notebook with hidden state** — every node is a pure function over dataframes. No reaching into a global scope. (Unlike Hex / Deepnote.)
- **Not yet 1.0** — APIs may change. Adopt with that in mind.

## Who it's for

Researchers, data journalists, analysts, and small data teams who want to:

1. Mix SQL / Python / R / JavaScript without writing glue or managing intermediate file handoffs.
2. Ship a result someone else can re-run end-to-end with one command (or one click in the Editor).
3. Publish their analysis as a readable HTML report alongside the raw data.

## Next

- [Download Rime Editor](/rime-docs/editor/install/) — the recommended start
- [Install the CLI](/rime-docs/get-started/install/) — for scripting and CI
- [Quick start](/rime-docs/get-started/quick-start/) — 10-minute walkthrough either way
