---
title: Node reference
description: Field reference and review guidance for Rime core nodes, statistical nodes, subgraphs, and language nodes.
---

Rime nodes are typed DAG steps. Some shape tables, some produce statistical objects, and language nodes let you drop into Python, R, JavaScript, or SQL when a built-in is not enough.

## How To Read These Pages

The node pages are not all shaped the same way. A statistical node needs interpretation and assumption guidance. A table transform needs review cues about shape, columns, and row counts. A language node needs a slot contract.

Each page keeps the schema facts close to the explanation, then spends its space on the parts that matter for that node: what problem it solves, what the output means, what to inspect in the editor or report, and when to choose a different node.

For transform formulas, start with [Expression language](/rime-docs/concepts/expressions/). For script-backed custom logic, start with [language nodes](/rime-docs/nodes/script/).

## Source And Table Transforms

| Node | Use it for | Watch for |
| --- | --- | --- |
| [source](/rime-docs/nodes/source/) | CSV, JSON, NDJSON, Parquet ingress | inferred types, missing paths, report noise |
| [filter](/rime-docs/nodes/filter/) | row-level cohort gates | unexpected row loss |
| [derive](/rime-docs/nodes/derive/) | one new feature column | null behavior, unreadable formulas |
| [aggregate](/rime-docs/nodes/aggregate/) | grouped or global metrics | metric aliases, collapsed row counts |
| [select](/rime-docs/nodes/select/) | schema narrowing | accidental column drops |
| [sort](/rime-docs/nodes/sort/) | review/report ordering | invisible changes when only row order changes |

## Combining Tables

| Node | Use it for | Watch for |
| --- | --- | --- |
| [join](/rime-docs/nodes/join/) | enriching a left table from a right table | many-to-many row expansion |
| [pivot](/rime-docs/nodes/pivot/) | long-to-wide summaries | high-cardinality column explosion |
| [concat](/rime-docs/nodes/concat/) | stacking peer tables into one tidy table | schema mode and added group labels |

## Statistical Nodes

Statistical nodes return object outputs. They are report-friendly terminals and can emit assumption warnings.

| Node | Use it for | Warning surface |
| --- | --- | --- |
| [t_test](/rime-docs/nodes/t_test/) | two-group mean comparison | small/skewed groups, outliers, high variance ratio |
| [anova](/rime-docs/nodes/anova/) | multi-group mean comparison | small/skewed groups, outliers, high variance ratio |
| [mann_whitney_u](/rime-docs/nodes/mann_whitney_u/) | rank-based two-group comparison | group validity; node-specific warnings are not emitted yet |
| [chi_square](/rime-docs/nodes/chi_square/) | categorical independence | low expected cell counts |
| [correlation](/rime-docs/nodes/correlation/) | pairwise numeric association | small n, Pearson/Spearman disagreement |
| [linear_regression](/rime-docs/nodes/linear_regression/) | single-predictor OLS | small n, high residual outliers |

## Composition And Escape Hatches

| Node | Use it for |
| --- | --- |
| [subgraph](/rime-docs/nodes/subgraph/) | wrapping an external DAG behind explicit bindings and outputs |
| [language nodes](/rime-docs/nodes/script/) | custom Python, R, JavaScript, or SQL logic |

## Shared Node Fields

Every node has an `id`, `kind`, and optional `metadata`.

```yaml
metadata:
  label: "Friendly node label"
  group: "feature_engineering"
  report: false
  visual_stats: ["row_count"]
  cache: false
```

Use `metadata.label` generously. Labels are what reviewers see on the editor canvas and in report DAGs, so they should explain the intent, not just repeat the node id.
