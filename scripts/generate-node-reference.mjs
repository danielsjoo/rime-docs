#!/usr/bin/env node
// Generate per-node-kind reference pages under src/content/docs/nodes/
// from the canonical NODE_REFERENCE.md at the repo root, enriched with
// per-kind metadata (inputs, outputs, when-to-use, common pitfalls).
//
// Title format: plain kind name (no backticks).
//   anova    ← correct
//   `anova`  ← what we used to do (looks ugly in Starlight breadcrumbs)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REF_PATH = path.join(ROOT, 'NODE_REFERENCE.md');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'content', 'docs', 'nodes');

// Per-kind metadata — drives the rich page sections below.
const KINDS = [
  {
    kind: 'source',
    blurb: 'File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value.',
    inputs: 'None — `source` is a root node.',
    outputs: '`default`: the loaded table. Schema is inferred from the file (`.parquet` preserves types; `.csv` infers headers; `.json` / `.ndjson` infer field types).',
    whenToUse: 'Whenever your data starts as a file on disk. For SQL-only pipelines, consider a `script` node with `language: sql` in ingress mode instead — it reads files directly via DuckDB and is often faster for large Parquet.',
    pitfalls: [
      'CSV header inference is best-effort — if column names contain non-ASCII or special characters, explicitly cast in a downstream `derive`.',
      'JSON files load as a single table — for ndjson (one record per line), use the `.ndjson` extension.',
    ],
  },
  {
    kind: 'filter',
    blurb: 'Keep rows matching a boolean expression.',
    inputs: '1 input. The table to filter.',
    outputs: '`default`: the input rows that satisfy `expr:`.',
    whenToUse: 'Slicing a cohort, removing nulls, gating on a threshold. The expression DSL supports `and`, `or`, `not`, arithmetic, and column methods like `.mean()` (though method calls only make sense in `aggregate`, not `filter`).',
    pitfalls: [
      'Column references use `[brackets]`: `[age] >= 18`, not `age >= 18`.',
      'Filtering on a derived column requires a `derive` node first — you can\'t reference a column that doesn\'t exist yet.',
    ],
  },
  {
    kind: 'derive',
    blurb: 'Add a computed column from existing columns.',
    inputs: '1 input. The table to extend.',
    outputs: '`default`: the input table with one additional column named by `as:`.',
    whenToUse: 'Computed features (BMI, ratios, normalized scores). For a one-step pipeline where you derive several columns at once, chain multiple `derive` nodes — they\'re cheap.',
    pitfalls: [
      'The new column name (`as:`) must not collide with an existing column. Use `select` first to drop the old one if you want to overwrite.',
      'Expressions can\'t reference other derived columns within the same node. Use a second `derive` for that.',
    ],
  },
  {
    kind: 'aggregate',
    blurb: 'Group rows by zero or more keys and reduce with named metrics.',
    inputs: '1 input. The table to aggregate.',
    outputs: '`default`: one row per group, columns = `groupBy:` keys + `metrics:` results.',
    whenToUse: 'Roll-ups for reports (mean / count / sum by category). For more complex windowed reductions, use a Python `script` node.',
    pitfalls: [
      '`groupBy:` can be empty (`[]`) for a global aggregation that produces exactly one row.',
      'Each metric must be a single named expression: `"[mean_age] = [age].mean()"`. Multiple metrics share one `aggregate` node.',
    ],
  },
  {
    kind: 'select',
    blurb: 'Keep a subset of columns by name.',
    inputs: '1 input.',
    outputs: '`default`: the input table restricted to columns listed in `columns:`.',
    whenToUse: 'Pruning before joins or expensive script nodes — narrower tables are cheaper to serialize across language boundaries.',
    pitfalls: [
      'Columns are kept in the order you list them. If you care about column ordering in the report, this is the node that controls it.',
      'Selecting a nonexistent column is a hard error (caught at validate time).',
    ],
  },
  {
    kind: 'sort',
    blurb: 'Order rows by one or more expressions.',
    inputs: '1 input.',
    outputs: '`default`: the input rows reordered by the sort keys.',
    whenToUse: 'Sorting for the report renderer, or before a window-like derive. For top-N, sort + a downstream Python script that does `.head(N)`.',
    pitfalls: [
      '`direction` defaults to `asc`. Use `desc` explicitly when you want descending.',
      'Multi-key sort: order in the `by:` array is significant (primary, secondary, tertiary key).',
    ],
  },
  {
    kind: 'join',
    blurb: 'Two-input inner or left join on column keys.',
    inputs: '2 inputs. Left and right tables (order matters for left joins).',
    outputs: '`default`: the joined table. Column names from the right side are suffixed to disambiguate if they collide with left-side names.',
    whenToUse: 'Combining two tables on a shared key. For more than two inputs, chain multiple joins.',
    pitfalls: [
      '`how: inner` (default) drops unmatched rows; `how: left` keeps all left-side rows with nulls for unmatched right-side columns.',
      'Many-to-many joins are allowed but produce the Cartesian product of matching rows — be careful with row count blow-up.',
    ],
  },
  {
    kind: 'pivot',
    blurb: 'Wide-format aggregation: one row per `index:` value, one column per distinct `columns:` value.',
    inputs: '1 input.',
    outputs: '`default`: the pivoted wide-format table.',
    whenToUse: 'Crosstabs, monthly summaries, A/B comparisons with each variant as a column. Inverse of an unpivot — use a Python script for un-pivot.',
    pitfalls: [
      '`agg:` defaults to `sum`. Use `mean` or `count` when sum doesn\'t make sense.',
      'High-cardinality `columns:` values produce wide tables that are hard to read. Filter the input first.',
    ],
  },
  {
    kind: 'concat',
    blurb: 'Stack tables row-wise with a label column distinguishing the source of each row.',
    inputs: '2+ inputs.',
    outputs: '`default`: the concatenated table with an added `source:` column (configurable name) indicating which input each row came from.',
    whenToUse: 'Combining same-shaped tables from different sources (e.g. monthly extracts, multi-site cohorts).',
    pitfalls: [
      'All inputs must share the same column names. Use `select` first if schemas differ.',
      "The label column makes it easy to filter downstream by source: `filter` on `[source] == \"site_a\"`.",
    ],
  },
  {
    kind: 't_test',
    blurb: 'Two-sample t-test — Welch (default) or equal-variance.',
    inputs: '1 input. The data must contain both a value column and a grouping column.',
    outputs: '`default`: a JSON-shaped result with `t_statistic`, `p_value`, `df`, `mean_a`, `mean_b`, and the sample sizes.',
    whenToUse: 'Comparing means of a continuous variable between two groups (control vs treatment, region A vs region B). For non-normal data, use `mann_whitney_u` instead.',
    pitfalls: [
      'Welch t-test (`equalVariance: false`, the default) is robust to unequal variances. Use the equal-variance variant only if you have strong reason to assume homogeneity.',
      'The `groupA` and `groupB` values must exist in `groupColumn`; otherwise validation fails at run time.',
    ],
  },
  {
    kind: 'anova',
    blurb: 'One-way analysis of variance across N groups.',
    inputs: '1 input. Data with a continuous outcome column and a grouping column.',
    outputs: '`default`: a JSON-shaped result with `F_statistic`, `p_value`, `df_between`, `df_within`, and per-group sample sizes / means.',
    whenToUse: 'Comparing means across three or more groups. For exactly two groups, use `t_test`. For non-normal data, consider Kruskal-Wallis (not built in — write a Python `script` node).',
    pitfalls: [
      'ANOVA assumes group variances are roughly equal. If they\'re not, results are less reliable; consider a non-parametric alternative.',
      'A significant overall F doesn\'t tell you which groups differ — follow up with pairwise `t_test` nodes for the comparisons you care about.',
    ],
  },
  {
    kind: 'mann_whitney_u',
    blurb: 'Non-parametric two-sample test (Mann-Whitney U / Wilcoxon rank-sum).',
    inputs: '1 input.',
    outputs: '`default`: a JSON-shaped result with `U_statistic`, `p_value`, and the sample sizes.',
    whenToUse: 'When you want to compare two groups but your data isn\'t normally distributed (skewed, ordinal, has outliers). Tests the null that values from group A are equally likely to be larger or smaller than values from group B.',
    pitfalls: [
      'Mann-Whitney tests stochastic dominance, not medians. If your two distributions have different shapes, the test result doesn\'t cleanly map to "the medians differ."',
      'For very small samples (n < 5 per group), the asymptotic p-value is unreliable — use Fisher\'s exact alternatives.',
    ],
  },
  {
    kind: 'chi_square',
    blurb: 'Chi-square test of independence between two categorical columns.',
    inputs: '1 input.',
    outputs: '`default`: a JSON-shaped result with `chi2_statistic`, `p_value`, `df`, and the observed-vs-expected contingency table.',
    whenToUse: 'Testing whether two categorical variables are independent (e.g. is region associated with product preference?).',
    pitfalls: [
      'Chi-square is unreliable when expected cell counts are < 5. For small tables, use Fisher\'s exact instead (not built in).',
      'A significant chi-square just means "not independent" — it doesn\'t tell you which cells contribute most. Inspect the contingency table.',
    ],
  },
  {
    kind: 'correlation',
    blurb: 'Pearson or Spearman correlation between two columns.',
    inputs: '1 input.',
    outputs: '`default`: a JSON-shaped result with `coefficient`, `p_value`, `n`, and the method used.',
    whenToUse: 'Quick check of linear (Pearson) or rank-order (Spearman) relationship between two continuous columns. For non-linear relationships, prefer `linear_regression` with feature engineering, or a Python script for more sophisticated measures.',
    pitfalls: [
      'Pearson assumes normality and linearity; Spearman is more robust but only captures monotonic relationships.',
      'Correlation is not causation. The node won\'t tell you which way the arrow points.',
    ],
  },
  {
    kind: 'linear_regression',
    blurb: 'Single-feature ordinary least squares regression, with optional train/test split.',
    inputs: '1 input.',
    outputs: '`default`: a JSON-shaped result with `intercept`, `slope`, `r_squared`, `p_value`, and (if `splitRatio` set) train/test metrics.',
    whenToUse: 'Quick single-predictor regression for a report stat callout. For multi-feature regression or non-linear models, use a Python `script` node with statsmodels or scikit-learn.',
    pitfalls: [
      'Single feature only. If you need multiple predictors, this is the wrong node.',
      '`splitRatio` defaults to no split (training on all data). Set to e.g. 0.8 if you want a held-out test set.',
    ],
  },
  {
    kind: 'subgraph',
    blurb: 'Embed an external `.dag.yaml` file as a node, with named bindings and exposed outputs.',
    inputs: 'Variable — driven by the `bindings:` map.',
    outputs: 'Variable — driven by the `outputs:` map.',
    whenToUse: 'Reusing a complete sub-pipeline across multiple projects, or composing one big DAG out of multiple smaller files. Subgraphs are opaque from the outside (good for encapsulation).',
    pitfalls: [
      '`bindings:` maps outer node refs to inner slot names; `outputs:` maps exposed names to inner node refs. Mismatches caught at validate time.',
      'Subgraphs don\'t share cache with their parent — running the same subgraph twice in one DAG produces two cached results, not one.',
    ],
  },
  {
    kind: 'script',
    blurb: 'Custom logic in Python, R, JavaScript, or SQL. The escape hatch when no core node fits.',
    inputs: 'Variable — declare named slots in `in:`. Each slot can be a dataframe ref or a `params.*` reference.',
    outputs: '`default` by default, or multiple named outputs declared in `out:`.',
    whenToUse: 'When the 14 core nodes don\'t cover your transform. See the per-language pages — [Python](/scripts/python/), [R](/scripts/r/), [JavaScript](/scripts/javascript/), [SQL](/scripts/sql/) — for function-signature details.',
    pitfalls: [
      'Multi-output nodes (`out:`) require the language function to return a dict / list / object whose keys match.',
      'No `params.*` slots → no params at all. To pass a top-level param to a script, you must wire it through the YAML.',
    ],
  },
];

const md = await readFile(REF_PATH, 'utf8');
await mkdir(OUT_DIR, { recursive: true });

// Pull YAML examples from NODE_REFERENCE.md by parsing per-kind headings.
// e.g. "## `source` — file-based ingress" → kind="source", body=everything until next ##.
const headingRe = /^(##|###)\s+`([a-z_]+)`/gm;
const sections = [];
let lastKind = null;
let lastStart = 0;
let match;
while ((match = headingRe.exec(md)) !== null) {
  if (lastKind) sections.push({ kind: lastKind, body: md.slice(lastStart, match.index).trim() });
  lastKind = match[2];
  lastStart = match.index;
}
if (lastKind) {
  const tail = md.slice(lastStart);
  const cutAt = tail.search(/\n##\s+(Removed in v2|Metadata|Reference)\b/);
  sections.push({ kind: lastKind, body: (cutAt >= 0 ? tail.slice(0, cutAt) : tail).trim() });
}
const refByKind = new Map(sections.map((s) => [s.kind, s.body]));

// Extract just the first ```yaml ... ``` block from the reference body.
function extractYamlExample(refBody) {
  if (!refBody) return null;
  const m = refBody.match(/```yaml\n([\s\S]*?)\n```/);
  return m ? m[1].trim() : null;
}

let written = 0;
for (const meta of KINDS) {
  const refBody = refByKind.get(meta.kind);
  const yaml = extractYamlExample(refBody);

  const pitfallsList = meta.pitfalls
    .map((p) => `- ${p}`)
    .join('\n');

  // YAML-safe quote: wrap in double quotes, escape any internal double quotes.
  const yamlString = (s) => `"${s.replace(/"/g, '\\"')}"`;

  const content = `---
title: ${meta.kind}
description: ${yamlString(meta.blurb)}
---

${meta.blurb}

## When to use

${meta.whenToUse}

## Inputs

${meta.inputs}

## Outputs

${meta.outputs}

## Example

${yaml ? '```yaml\n' + yaml + '\n```' : '> Example pending — see [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) in the upstream repo for the field list.'}

## Common pitfalls

${pitfallsList}

## See also

- [\`script\` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [\`packages/core/src/schema.ts\`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
`;

  await writeFile(path.join(OUT_DIR, `${meta.kind}.md`), content);
  written += 1;
}

console.log(`generate-node-reference: wrote ${written} pages to ${path.relative(process.cwd(), OUT_DIR)}/`);
