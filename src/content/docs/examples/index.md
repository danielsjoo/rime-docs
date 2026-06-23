---
title: Examples
description: Real Rime pipelines you can clone, run, and remix.
---

import { CardGrid, LinkCard } from '@astrojs/starlight/components';

Rime examples are complete projects: DAGs, scripts, data, and the expected
artifacts they write. Use this section as a cookbook after the
[quick start](/rime-docs/get-started/quick-start/).

![Rime report preview showing the DAG overview, cached nodes, and persisted table outputs.](../../../assets/screenshots/rime-runtime-report.png)

## Choose an Example

| If you want to learn... | Start with |
|---|---|
| The minimum DAG shape | [Single-file pipeline](/rime-docs/examples/single-file/) |
| Built-in nodes over tabular data | [Penguin classifier](/rime-docs/examples/penguins/) |
| SQL ingress through DuckDB | [DuckDB single source](/rime-docs/examples/sql-only/) |
| A larger multi-branch graph | [DAG showcase](/rime-docs/examples/dag-showcase/) |
| Programmatic execution | [Embed in Node](/rime-docs/examples/headless/) |
| A full polyglot narrative | [Cars x CO2 emissions](/rime-docs/examples/cars-emissions/) |

## Flagship

<CardGrid>
  <LinkCard
    title="Cars x CO2 emissions"
    description="SQL source + JS API fetch + Python UMAP + R regression → one HTML narrative. The canonical multi-language example."
    href="/rime-docs/examples/cars-emissions/"
  />
</CardGrid>

## Teaching

<CardGrid>
  <LinkCard
    title="Penguin classifier"
    description="Smallest interesting DAG. Pivot, derive, t-test, plot. Best place to start after the Quick start."
    href="/rime-docs/examples/penguins/"
  />
  <LinkCard
    title="DAG showcase"
    description="A compact clinical-style graph that combines sources, SQL, derives, aggregates, and stat nodes."
    href="/rime-docs/examples/dag-showcase/"
  />
  <LinkCard
    title="Single-file pipeline"
    description="A DAG that lives in one YAML file with no project marker. The smallest possible Rime project."
    href="/rime-docs/examples/single-file/"
  />
</CardGrid>

## Integration

<CardGrid>
  <LinkCard
    title="Embed in Node"
    description="Use @rimekit/runtime programmatically from any Node script. For CI plugins and custom dashboards."
    href="/rime-docs/examples/headless/"
  />
  <LinkCard
    title="DuckDB single source"
    description="Pure-SQL pipeline using DuckDB ingress mode. No Python or R required."
    href="/rime-docs/examples/sql-only/"
  />
</CardGrid>

## Cookbook Pattern

Each example page follows the same format:

1. What the example teaches.
2. The project layout.
3. The important DAG nodes.
4. How to validate, run, and build.
5. Which artifacts to inspect.

When evaluating an example, open both the DAG and the generated report. The DAG
shows the contract; the report shows whether the contract produced the expected
tables, stats, warnings, and cache behavior.
