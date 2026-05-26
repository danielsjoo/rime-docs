---
title: What is Rime?
description: A high-level overview of Rime — what it is, what it isn't, who it's for. (TL;DR — open the Rime Editor and you're 80% of the way there.)
---

## TL;DR — open the Editor

The fastest path into Rime is to **download [Rime Editor](/editor/install/)**, open it, drop a CSV in, and wire up a few nodes. No YAML to learn. No CLI. Just reactive blocks that show their data as you connect them.

The Editor is the front door. Everything below explains what's happening under it.

## What Rime is

Rime is a workflow system for authoring **polyglot data pipelines** and turning their outputs into **publishable narratives**.

A pipeline is a DAG (directed acyclic graph) of typed transforms. Each node is one of:

- A **core node** — `filter`, `aggregate`, `join`, `pivot`, `sort`, `select`, `derive`, `concat`, or one of six statistical tests (`t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`, `linear_regression`). The runtime ships these; you don't write code.
- A **script node** in Python, R, JavaScript, or SQL — for anything the core nodes don't cover. You write a function; the runtime owns I/O, serialization, and language boundaries. See the [per-language script pages](/scripts/python/).

The DAG runs, outputs are content-addressed and cached, and — if you pair it with a `report.yaml` — the results render as an HTML document with tables, stat callouts, and prose.

## Two ways to author

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

## Compared to

- **Hex / Deepnote** — closed-source SaaS notebooks with reactive cells. Rime is functional (not cell-scoped) and open source — runs on your laptop, in your CI, no per-seat licensing.
- **Snakemake / Nextflow** — Rime's closest neighbors in spirit. Same polyglot DAG idea, different ergonomics: Rime ships with built-in transforms and a report layer; Snakemake/Nextflow are lower-level workflow engines tuned for bioinformatics file pipelines.
- **dbt** — SQL-only, production-oriented. Rime borrows dbt's "you write the SELECT, we handle materialization" mental model and extends it past SQL.
- **Quarto / R Markdown** — document-first. Rime is pipeline-first; reports are a downstream concern.
- **Airflow / Prefect / Dagster** — Rime is not in this family. Those tools wire I/O between tasks; Rime treats nodes as pure functions and owns I/O itself.

## Next

- [Download Rime Editor](/editor/install/) — the recommended start
- [Install the CLI](/get-started/install/) — for scripting and CI
- [Quick start](/get-started/quick-start/) — 10-minute walkthrough either way
