---
title: Examples
description: Real Rime pipelines you can clone, run, and remix. Multi-language narratives, single-file teaching examples, headless embeds.
---

import { CardGrid, LinkCard } from '@astrojs/starlight/components';

Rime ships with curated example pipelines that double as documentation. Each one is a complete project — DAG, scripts, data, and a rendered HTML report.

## Flagship

<CardGrid>
  <LinkCard
    title="Cars × CO₂ emissions"
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
    description="Walk through every core node kind with a tiny example each."
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

## More examples

We're filling these in over time. See [EXAMPLES_PLAN.md](https://github.com/danielsjoo/rime-docs/blob/main/EXAMPLES_PLAN.md) for the porting roadmap and a list of 14 more fixtures that could become examples.

Want to contribute one? Open an issue or PR on [rime-docs](https://github.com/danielsjoo/rime-docs).
