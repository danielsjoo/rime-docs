---
title: What is Rime?
description: "A high-level overview of Rime: DAGs, nodes, caching, reports, and when to use it."
---

Rime is a local workflow system for reproducible, polyglot data analysis.
You declare a DAG of typed nodes, Rime runs the graph, caches every output, and
can render the run as an HTML report.

## The Short Version

| Idea | Meaning |
|---|---|
| DAG | A `pipeline.dag.yaml` file describes the graph and node configuration. |
| Node | A pure step over tabular data: read a source, transform rows, run SQL, call Python/R/JS, or compute a statistic. |
| Runtime | Rime materializes inputs, executes the node, captures logs and plots, and persists outputs. |
| Cache | A node reruns only when its definition, source code, inputs, or runtime version changes. |
| Report | `rime build` turns the run into `outputs/run_report.html`. |

Most projects mix two node styles:

- **Core nodes** for ordinary table work: `filter`, `derive`, `aggregate`,
  `join`, `pivot`, `select`, `sort`, `concat`, and built-in statistical tests.
- **Language nodes** for custom work in SQL, Python, R, or JavaScript. You write
  the function or query; Rime owns dataframe handoff and artifact writing.

## A Tiny Pipeline

```yaml
specification_version: "2.1"
nodes:
  - id: penguins
    kind: source
    path: data/penguins.csv

  - id: adelie_only
    kind: filter
    inputs: [penguins]
    expr: '[species] == "Adelie"'

  - id: by_island
    kind: aggregate
    inputs: [adelie_only]
    groupBy: ["[island]"]
    metrics:
      - "[mean_bill_length] = [bill_length_mm].mean()"
      - "[n] = [bill_length_mm].count()"
```

Run it with:

```bash
rime run pipeline.dag.yaml
rime build pipeline.dag.yaml
```

The first command writes Parquet/JSON artifacts under `outputs/`. The second
also writes an HTML report.

## What Rime is not

- **Not an orchestrator.** There is no scheduler, cloud runner, queue, or retry
  policy. Use Airflow, Prefect, or Dagster for that layer.
- **Not a notebook with hidden state.** Nodes are pure functions over declared
  inputs. Downstream work depends on named outputs, not ambient cell state.
- **Not a warehouse transformation framework.** SQL is first-class, but Rime is
  built for local analysis graphs that may cross several languages.
- **Not yet 1.0.** APIs and file formats can still change.

## Who it's for

Researchers, data journalists, analysts, and small data teams who want to:

1. Mix SQL, Python, R, and JavaScript without writing file handoff glue.
2. Re-run an analysis end to end with one command.
3. Keep intermediate data, logs, figures, stats, and reports tied to the same
   DAG run.

## Compared to

- **dbt:** SQL-only and warehouse-oriented. Rime borrows the "write the query,
  let the tool materialize it" model and extends it beyond SQL.
- **Quarto / R Markdown:** document-first. Rime is pipeline-first; reports come
  from the executed graph.
- **Snakemake / Nextflow:** file-oriented workflow engines. Rime is dataframe-
  and report-oriented, with built-in table/stat nodes.
- **Airflow / Prefect / Dagster:** orchestration systems. Rime does not schedule
  or deploy jobs; it makes a local analytical graph reproducible.

## Next

- [Install the CLI](/rime-docs/get-started/install/)
- [Quick start](/rime-docs/get-started/quick-start/)
- [Workshop: build a first pipeline](/rime-docs/workshops/first-pipeline/)
- [Concepts: nodes](/rime-docs/concepts/nodes/)
