---
title: Node reference
description: Field reference for Rime core nodes and language nodes.
---

Rime nodes are typed DAG steps. Core nodes cover common table operations and statistical checks; language nodes let you write custom Python, R, JavaScript, or SQL when a built-in does not fit.

## Core transforms

- [source](/rime-docs/nodes/source/) — file-based ingress for CSV, JSON, NDJSON, and Parquet
- [filter](/rime-docs/nodes/filter/) — keep rows matching a boolean expression
- [derive](/rime-docs/nodes/derive/) — add one computed column
- [aggregate](/rime-docs/nodes/aggregate/) — group rows and compute metrics
- [select](/rime-docs/nodes/select/) — keep a named subset of columns
- [sort](/rime-docs/nodes/sort/) — order rows by one or more expressions
- [join](/rime-docs/nodes/join/) — inner or left join on column keys
- [pivot](/rime-docs/nodes/pivot/) — wide-format aggregation
- [concat](/rime-docs/nodes/concat/) — stack tables row-wise
- [subgraph](/rime-docs/nodes/subgraph/) — embed another DAG as a node

## Statistical checks

- [t_test](/rime-docs/nodes/t_test/) — two-sample t-test
- [anova](/rime-docs/nodes/anova/) — one-way analysis of variance
- [mann_whitney_u](/rime-docs/nodes/mann_whitney_u/) — non-parametric two-sample test
- [chi_square](/rime-docs/nodes/chi_square/) — test independence between categorical columns
- [correlation](/rime-docs/nodes/correlation/) — Pearson or Spearman correlation
- [linear_regression](/rime-docs/nodes/linear_regression/) — single-feature ordinary least squares regression

## Language nodes

- [language nodes](/rime-docs/nodes/script/) — shared fields for Python, R, JavaScript, and SQL nodes
- [Python](/rime-docs/scripts/python/) — pandas-based transforms
- [R](/rime-docs/scripts/r/) — tibble-based transforms
- [JavaScript](/rime-docs/scripts/javascript/) — Node-based transforms
- [SQL](/rime-docs/scripts/sql/) — DuckDB-backed transforms
