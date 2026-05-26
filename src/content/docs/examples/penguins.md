---
title: Penguin classifier
description: The smallest interesting Rime DAG — source, filter, derive, aggregate, t-test, plot — using the classic Palmer penguins dataset. Best teaching example.
---

> 🚧 **This page is a stub.** Real content is being authored from the [`penguin` fixture](https://github.com/danielsjoo/rime/tree/main/packages/core/test/fixtures/experiments/penguin) in the rime repo. See [EXAMPLES_PLAN.md](https://github.com/danielsjoo/rime-docs/blob/main/EXAMPLES_PLAN.md) for the porting plan.

## What this example will demonstrate

The smallest interesting Rime DAG, built step by step:

1. `source` — load the [Palmer penguins](https://allisonhorst.github.io/palmerpenguins/) CSV.
2. `filter` — keep just one species (Adelie).
3. `derive` — compute body mass index from mass + flipper length.
4. `aggregate` — group by island, summarize.
5. `t_test` — compare two islands' mean body mass.
6. `report.yaml` — render the result as one table + one stat callout.

Good for: first time seeing how the core nodes compose, what the YAML looks like, and how a report rolls up.

## Run it locally

```bash
git clone https://github.com/danielsjoo/rime
cd rime/packages/core/test/fixtures/experiments/penguin
rime run pipeline.dag.yaml
```
