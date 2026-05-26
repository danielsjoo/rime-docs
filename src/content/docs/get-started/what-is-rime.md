---
title: What is Rime?
description: A high-level overview of Rime — what it is, what it isn't, who it's for.
---

Rime is a workflow system for authoring **polyglot data pipelines** and turning their outputs into **publishable narratives**.

You describe a pipeline as a DAG (directed acyclic graph) of typed transforms, written in a single YAML file. Each transform — called a "node" — is one of:

- A **built-in operator**: `filter`, `aggregate`, `join`, `pivot`, `sort`, `select`, `derive`, `concat`, `t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`, `linear_regression`.
- A **script node** in Python, R, JavaScript, or SQL. Scripts declare their inputs as named slots and receive them as native objects in each language (pandas DataFrames in Python, tibbles in R, arrow tables in JS, DuckDB temp tables in SQL).

Rime runs the DAG, caches outputs by content hash, and — if you pair it with a `report.yaml` — renders the results as an HTML document with tables, stat callouts, and prose.

## What Rime is

- **A DAG runtime** for typed tabular data, with SQL, Python, R, and JS as first-class languages.
- **A reproducibility layer**: content-addressed cache, deterministic outputs, "freeze" snapshots that capture the full pipeline state for archival.
- **A report renderer** that turns DAG outputs + a tiny YAML grammar into a publishable HTML document.

## What Rime isn't

- **Not an orchestrator** — there's no scheduler, no cloud-runner, no retry-on-failure. Use Airflow / Prefect / Dagster for those concerns.
- **Not a notebook** — there's no live REPL or interactive cell execution. The unit of authoring is a file, not a cell.
- **Not yet 1.0** — APIs may change. Adopt with that in mind.

## Who it's for

Researchers, analysts, and data teams who want to:

1. Mix languages without writing glue code or managing intermediate file handoffs.
2. Ship a result that someone else can re-run end-to-end with one command.
3. Publish their analysis as a readable HTML report alongside the raw data.

## Compared to

- **Snakemake / Nextflow** — Rime's closest neighbors. Same polyglot DAG idea, different ergonomics: Rime ships with built-in transforms and a report layer; Snakemake/Nextflow are lower-level workflow engines.
- **dbt** — SQL-only, production-oriented. Rime overlaps where dbt models would otherwise be hand-written; differs in supporting Python/R/JS as peer languages.
- **Quarto / R Markdown** — document-first. Rime is pipeline-first; reports are a downstream concern.

## Next

- [Install](/get-started/install/)
- [Quick start](/get-started/quick-start/)
