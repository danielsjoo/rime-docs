---
title: Cars × CO₂ emissions
description: A flagship multi-language Rime pipeline — SQL source + JavaScript API fetch + Python UMAP + R regression → rendered HTML narrative. Demonstrates polyglot DAGs end-to-end.
---

> 🚧 **This page is a stub.** Real content is being ported from the [`cars-emissions-narrative` fixture](https://github.com/danielsjoo/rime/tree/main/packages/core/test/fixtures/experiments/cars-emissions-narrative) in the rime repo. See [EXAMPLES_PLAN.md](https://github.com/danielsjoo/rime-docs/blob/main/EXAMPLES_PLAN.md) for the porting plan.

## What this example demonstrates

- **Four languages in one DAG**: SQL (via DuckDB) for the source query, JavaScript for an external CO₂ API fetch, Python for UMAP embedding, R for an efficiency-trends linear regression.
- **Dataframes crossing language boundaries** via Arrow IPC — no manual file handoffs, no serialization decisions in user code.
- **Statistical terminal nodes** (`t_test` for USA vs Japan MPG, `anova` for cylinder counts) rendered as stat-style output cells in the auto-report.
- **A rendered HTML report** weaving tables, statistics, and prose into a publishable narrative.

## Run it locally

Until the example is fully ported, you can run the source fixture directly:

```bash
git clone https://github.com/danielsjoo/rime
cd rime/packages/core/test/fixtures/experiments/cars-emissions-narrative
cat EXPERIMENT.md   # walkthrough lives here for now
rime run pipeline.dag.yaml
open outputs/narrative.html
```

The `EXPERIMENT.md` in that directory is the canonical write-up and contains the same content this docs page will eventually have.

## Hosted report

Coming soon — once we have a stable build host for example output, this page will link to a live rendering of `narrative.html`.
