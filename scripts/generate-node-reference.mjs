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
    whenToUse: 'Whenever your data starts as a file on disk. For SQL-only pipelines, consider a `kind: sql` node in ingress mode instead — it reads files directly via DuckDB and is often faster for large Parquet.',
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
    whenToUse: 'Slicing a cohort, removing nulls, gating on a threshold. The expression language supports boolean operators, arithmetic, comparisons, membership checks, and functions like `coalesce(...)`.',
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
    whenToUse: 'Roll-ups for reports (mean / count / sum by category). For more complex windowed reductions, use a `kind: python` node.',
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
    whenToUse: 'Pruning before joins or expensive language nodes — narrower tables are cheaper to serialize across language boundaries.',
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
    blurb: 'Two-sample t-test with either pooled equal-variance or Welch-style unequal-variance standard errors.',
    inputs: '1 input. The data must contain both a value column and a grouping column.',
    outputs: '`default`: a JSON-shaped result with `t_statistic`, `p_value`, `df`, `mean_a`, `mean_b`, and the sample sizes.',
    whenToUse: 'Comparing means of a continuous variable between two groups (control vs treatment, region A vs region B). `equalVariance: true` is the schema default; set `equalVariance: false` when you want the Welch-style unequal-variance calculation. For ordinal or heavily non-normal data, use `mann_whitney_u` instead.',
    pitfalls: [
      'Welch-style t-test (`equalVariance: false`) is more robust to unequal variances. Use the equal-variance variant only if you have strong reason to assume homogeneity.',
      'The `groupA` and `groupB` values must exist in `groupColumn`; otherwise validation fails at run time.',
    ],
  },
  {
    kind: 'anova',
    blurb: 'One-way analysis of variance across N groups.',
    inputs: '1 input. Data with a continuous outcome column and a grouping column.',
    outputs: '`default`: a JSON-shaped result with `F_statistic`, `p_value`, `df_between`, `df_within`, and per-group sample sizes / means.',
    whenToUse: 'Comparing means across three or more groups. For exactly two groups, use `t_test`. For non-normal data, consider Kruskal-Wallis (not built in — write a `kind: python` node).',
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
      'For very small samples (n < 5 per group), the asymptotic p-value is unreliable; use an exact, permutation, or bootstrap approach in a Python/R node if the distinction matters.',
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
    outputs: '`default`: a JSON-shaped result with `intercept`, `slope`, `r2`, `p_value`, confidence interval, and effect-size fields.',
    whenToUse: 'Quick single-predictor regression for a report stat callout. For multi-feature regression or non-linear models, use a `kind: python` node with statsmodels or scikit-learn.',
    pitfalls: [
      'Single feature only. If you need multiple predictors, this is the wrong node.',
      '`testFraction` defaults to no split (training on all data). Set a value like `0.2` when you want a deterministic held-out test fraction.',
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
    kind: 'html',
    blurb: 'Package an authored HTML file as a cached `html_artifact` and embed it in the generated report.',
    inputs: 'Variable — declare named data slots in `in:`. `params.*` refs are injected into the payload but do not draw DAG edges.',
    outputs: '`default`: an HTML artifact written as `outputs/<nodeId>/default.html` and rendered in report output cells.',
    whenToUse: 'When the last mile is a custom browser-side chart, D3/Observable/Vega page, bespoke interactive widget, or hand-authored HTML narrative that should live alongside the DAG outputs.',
    pitfalls: [
      'Rime does not execute or screenshot browser-side JavaScript during the run. It injects data and writes HTML; the browser renders it later.',
      'The authored file participates in cache keys. Editing the HTML source reruns the node and descendants.',
      'Keep the HTML deterministic when reproducibility matters: avoid ambient timestamps, random values, or network-only assets.',
    ],
  },
  {
    kind: 'script',
    title: 'language nodes',
    blurb: 'Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits.',
    inputs: 'Variable — declare named slots in `in:`. Each slot can be a dataframe ref or a `params.*` reference.',
    outputs: '`default` by default, or multiple named outputs declared in `out:`.',
    whenToUse: 'When the built-in table, statistical, and artifact nodes don\'t cover your transform. See the per-language pages — [Python](/scripts/python/), [R](/scripts/r/), [JavaScript](/scripts/javascript/), [SQL](/scripts/sql/) — for function-signature details.',
    pitfalls: [
      'Multi-output nodes (`out:`) require the language function to return a dict / list / object whose keys match.',
      'No `params.*` slots → no params at all. To pass a top-level param to a language node, you must wire it through the YAML.',
    ],
    example: `specification_version: "2.1"

params:
  threshold: { type: float, default: 0.5 }

nodes:
  - id: features
    kind: python
    source: scripts/features.py
    in:
      cohort: upstream_node
      threshold: params.threshold
    out:
      default: table
    entrypoint: run`,
  },
];

const FIELD_ROWS_BY_KIND = {
  source: [
    ['`id`', 'yes', 'Source binding key. Runtime source overrides and editor file bindings are keyed by this id.'],
    ['`kind`', 'yes', 'Always `source`.'],
    ['`path`', 'run-time required', 'Project-relative CSV, JSON, NDJSON, or Parquet path. The editor may hold an unfinished source without a path, but a run needs one or a runtime source override.'],
    ['`metadata.report`', 'no', 'Often `false` for raw files so reports start at the first meaningful transform.']
  ],
  filter: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`expr`', 'yes', 'Boolean expression evaluated per row. Truthy rows are kept.'],
    ['`metadata.label`', 'no', 'Use a readable label such as “Keep visits after baseline”; the expression itself is usually too terse for reviewers.']
  ],
  derive: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`as`', 'yes', 'Identifier-shaped output column name.'],
    ['`expr`', 'yes', 'Expression compiled to a Polars expression and aliased to `as`.']
  ],
  aggregate: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`groupBy`', 'yes', 'Array of expressions. Empty array means one global summary row.'],
    ['`metrics`', 'yes', 'One or more alias expressions like `"[mean_age] = [age].mean()"`.']
  ],
  select: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`columns`', 'yes', 'Array of selected columns. Runtime compiles each entry as an expression, while the schema currently restricts them to identifier-shaped strings.']
  ],
  sort: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`by`', 'yes', 'Ordered list of sort clauses. Earlier clauses are primary keys.'],
    ['`by[].expr`', 'yes', 'Expression used as a sort key.'],
    ['`by[].direction`', 'no', '`asc` by default; set `desc` explicitly for descending order.']
  ],
  join: [
    ['`inputs`', 'yes', 'Exactly two upstream tables: left first, right second.'],
    ['`leftKey`', 'yes', 'Bare column name or expression evaluated on the left table.'],
    ['`rightKey`', 'yes', 'Bare column name or expression evaluated on the right table.'],
    ['`how`', 'no', '`inner` by default; `left` keeps all left rows.']
  ],
  pivot: [
    ['`inputs`', 'yes', 'Exactly one upstream table.'],
    ['`index`', 'yes', 'Columns that remain as row identity in the wide result.'],
    ['`columns`', 'yes', 'Categorical column whose distinct values become output columns.'],
    ['`values`', 'yes', 'Numeric value column to aggregate into each pivot cell.'],
    ['`agg`', 'no', '`sum` by default; also supports `mean` and `count`.']
  ],
  concat: [
    ['`inputs`', 'yes', 'Two or more upstream tables.'],
    ['`groupColumn`', 'yes', 'New column added to every output row identifying the source input.'],
    ['`groupLabels`', 'no', 'Labels for each input; defaults to the input refs.'],
    ['`schemaMode`', 'no', '`strict` by default; `intersect` keeps shared columns, `union` fills missing cells with null.']
  ],
  t_test: [
    ['`inputs`', 'yes', 'Exactly one tidy table.'],
    ['`valueColumn`', 'yes', 'Continuous numeric outcome.'],
    ['`groupColumn`', 'yes', 'Column containing group labels.'],
    ['`groupA`, `groupB`', 'yes', 'The two group values to compare.'],
    ['`equalVariance`', 'no', '`true` by default; set `false` for Welch-style unequal-variance standard errors.']
  ],
  anova: [
    ['`inputs`', 'yes', 'Exactly one tidy table.'],
    ['`valueColumn`', 'yes', 'Continuous numeric outcome.'],
    ['`groupColumn`', 'yes', 'Column containing two or more groups.'],
    ['`groupLabels`', 'no', 'Optional display/order hint for the groups.']
  ],
  mann_whitney_u: [
    ['`inputs`', 'yes', 'Exactly one tidy table.'],
    ['`valueColumn`', 'yes', 'Numeric or ordinal outcome.'],
    ['`groupColumn`', 'yes', 'Column containing group labels.'],
    ['`groupA`, `groupB`', 'yes', 'The two group values to compare.']
  ],
  chi_square: [
    ['`inputs`', 'yes', 'Exactly one table.'],
    ['`columnA`', 'yes', 'First categorical variable.'],
    ['`columnB`', 'yes', 'Second categorical variable.']
  ],
  correlation: [
    ['`inputs`', 'yes', 'Exactly one table.'],
    ['`columnA`, `columnB`', 'yes', 'Numeric columns to pair row-wise.'],
    ['`method`', 'no', '`pearson` by default; `spearman` ranks values first.']
  ],
  linear_regression: [
    ['`inputs`', 'yes', 'Exactly one table.'],
    ['`feature`', 'yes', 'Single numeric predictor.'],
    ['`target`', 'yes', 'Numeric outcome.'],
    ['`testFraction`', 'no', 'Optional holdout fraction between 0 and 1.'],
    ['`seed`', 'no', 'Optional integer seed for deterministic splitting.']
  ],
  subgraph: [
    ['`source`', 'yes', 'External `.dag.yaml` file.'],
    ['`bindings`', 'no', 'Map from inner slot name to outer input ref.'],
    ['`outputs`', 'no', 'Map from exposed output name to inner node ref.'],
    ['`inputs`', 'derived', 'Optional compatibility field; bindings are the real contract.']
  ],
  html: [
    ['`source`', 'yes', 'Project-relative HTML file, usually under `reportsDir/` such as `reports/chart.html`.'],
    ['`in`', 'no', 'Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`.'],
    ['`inputs`', 'derived', 'Synthesized from `in:` for DAG traversal; do not write it by hand.'],
    ['`metadata.report`', 'no', '`true` by default; set `false` when you want the artifact on disk but out of the auto report.']
  ],
  script: [
    ['`kind`', 'yes', '`python`, `r`, `javascript`, or `sql`. Legacy `kind: script` also carries `language`.'],
    ['`source`', 'run-time required', 'Project-relative script/query path. The editor can create an unfinished node, but a run needs a source file.'],
    ['`in`', 'no', 'Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`.'],
    ['`out`', 'no', 'Declared output map or list. Omit for the manifest/default output.'],
    ['`entrypoint`', 'no', 'Function/export name for languages that need one.']
  ]
};

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

function escapeTableCell(value) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />');
}

function renderFieldTable(kind, title = 'YAML shape') {
  const rows = FIELD_ROWS_BY_KIND[kind];
  if (!rows || rows.length === 0) return '';
  const body = rows
    .map(([field, required, notes]) => `| ${field} | ${required} | ${escapeTableCell(notes)} |`)
    .join('\n');
  return `\n## ${title}\n\n| Field | Required | Notes |\n| --- | --- | --- |\n${body}\n`;
}

const NODE_PAGE_SECTIONS = {
  source: [
    {
      paragraphs: [
        'A `source` node is where bytes on disk become a Rime table. Keep this node boring: name the file, load it, and let downstream nodes do cleanup or interpretation.',
        'That separation makes reports easier to read. A raw CSV source can stay out of the report while the first meaningful transform gets the review attention.'
      ]
    },
    {
      title: 'Use it at the edge',
      paragraphs: [
        'Use `source` when the project starts from a local CSV, JSON, NDJSON, or Parquet file. It has no parents and usually sits at the top of the DAG.',
        'If a SQL query should read a file directly with DuckDB, use a `kind: sql` language node instead. That path is often better for large Parquet or SQL-first ingestion.'
      ]
    },
    { type: 'fields', title: 'Source contract' },
    {
      title: 'What to inspect',
      bullets: [
        'The path is project-relative and can be replaced at run time with `--source <id>=<file>`.',
        'Parquet preserves types best. CSV and JSON inference are convenient, but worth checking in the editor preview.',
        'Set `metadata.report: false` for noisy raw inputs when the report should begin at a cleaned or joined table.'
      ]
    },
    { type: 'example', title: 'Small example' },
    {
      type: 'related',
      links: [
        '- [SQL language nodes](/scripts/sql/) - use DuckDB when ingestion is query-shaped',
        '- [Dataset scanning](/editor/dataset-scanning/) - how the editor previews loaded tables'
      ]
    }
  ],
  filter: [
    {
      paragraphs: [
        'A `filter` node is a named row gate. The schema stays the same; only the set of rows changes.',
        'Good filter nodes read like cohort decisions: adults only, visits after baseline, active accounts, non-null outcomes. If the expression needs a paragraph to explain it, split the logic into an upstream `derive` with a readable feature name.'
      ]
    },
    { type: 'fields', title: 'Filter shape' },
    {
      title: 'Expression guidance',
      bullets: [
        'Write a boolean expression such as `[age] >= 18` or `[status] == "active"`.',
        'Use bracketed column refs and plain literals. Row-level functions like `coalesce([score], 0)` are fine.',
        'Do not hide aggregations inside a filter. Build summaries with `aggregate`, then filter the summarized table.'
      ]
    },
    {
      title: 'Reviewing the result',
      paragraphs: [
        'The important review question is row loss. Compare input rows to output rows and make sure a zero-row result is intentional.',
        'Expression parse or evaluation errors fail the node and downstream dependents. The best UI and report copy should point at the expression, not the whole DAG.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [Expression language](/concepts/expressions/) - syntax for row predicates']
    }
  ],
  derive: [
    {
      paragraphs: [
        '`derive` adds one computed column. It is the right node when a feature deserves a name and should be inspectable in the DAG.',
        'Prefer a chain of small derives over one opaque script when each intermediate feature is useful for review. Use a language node when the computation needs loops, model code, external packages, or multiple output columns at once.'
      ]
    },
    { type: 'fields', title: 'Feature contract' },
    {
      title: 'Writing the expression',
      bullets: [
        '`expr` is compiled to Polars and aliased to `as`, so the expression itself does not need an assignment.',
        'Use `coalesce()` when nulls should become a default value instead of following native null behavior.',
        'The new `as` column cannot collide with an existing column. Drop or rename first if you mean to replace something.'
      ]
    },
    {
      title: 'Reviewing the result',
      paragraphs: [
        'The preview should make the new column easy to find. For numeric features, a distribution/profile is usually more useful than a long row sample.',
        '`default` is the input table plus the new column.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: [
        '- [Expression language](/concepts/expressions/) - supported operators and functions',
        '- [select](/nodes/select/) - narrow or reorder columns after deriving'
      ]
    }
  ],
  aggregate: [
    {
      paragraphs: [
        '`aggregate` turns row-level data into named summaries. It emits one row per group, or one global summary row when `groupBy: []`.',
        'This is the node to reach for when the output columns are the story: counts by site, mean score by arm, maximum date per account, or a compact table for a report.'
      ]
    },
    { type: 'fields', title: 'Aggregation contract' },
    {
      title: 'Designing metrics',
      bullets: [
        'Each metric should be an alias expression, for example `"[mean_score] = [score].mean()"`.',
        'Keep metric names report-ready. Anonymous or machine-looking aliases make the resulting table harder to review.',
        'Common reducers include `.sum()`, `.mean()`, `.count()`, `.min()`, `.max()`, `.n_unique()`, and `.distinct()`.'
      ]
    },
    {
      title: 'What changes',
      paragraphs: [
        '`default` contains the group keys plus metric columns. The row count usually collapses, so output shape is the first thing to inspect.',
        'For more complex windowed reductions or custom statistics, move to a Python, R, JavaScript, or SQL node.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [Expression language](/concepts/expressions/) - group and metric expressions']
    }
  ],
  select: [
    {
      paragraphs: [
        '`select` is a schema decision. It keeps the columns you name, in the order you name them.',
        'Use it to make the next node cheaper and clearer: trim wide source tables, prepare a report table, or define the exact payload crossing into a language node.'
      ]
    },
    { type: 'fields', title: 'Projection contract' },
    {
      title: 'Review notes',
      bullets: [
        '`default` is the same rows with only the selected columns.',
        'Column order is part of the node behavior, so use `select` when report ordering matters.',
        'Selecting a nonexistent column is a hard validation error.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: [
        '- [derive](/nodes/derive/) - create named features before selecting them',
        '- [Expression language](/concepts/expressions/) - projection syntax notes'
      ]
    }
  ],
  sort: [
    {
      paragraphs: [
        '`sort` changes row order without changing values or schema. That makes it easy to miss in a DAG unless the node label says why the order matters.',
        'Use it before report tables, deterministic previews, or downstream work where the first rows carry meaning.'
      ]
    },
    { type: 'fields', title: 'Sort contract' },
    {
      title: 'Ordering choices',
      bullets: [
        '`by` is ordered: first clause is primary, second is secondary, and so on.',
        '`direction` defaults to `asc`. Use `desc` explicitly when descending order is the intent.',
        'Sort expressions can be computed keys, but simple descending order is clearer as `direction: desc` than as a negated expression.'
      ]
    },
    {
      title: 'Reviewing the result',
      paragraphs: [
        '`default` is the input rows reordered. Because shape does not change, inspect the first rows and the sort keys rather than row counts.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [Expression language](/concepts/expressions/) - sort key expressions']
    }
  ],
  join: [
    {
      paragraphs: [
        '`join` enriches one table with another. The left input is the anchor, especially for `how: left`; the right input supplies matching columns.',
        'Use one join for one relationship. If the explanation has to say "and then it also joins...", chain another join so the row-count effect stays inspectable.'
      ]
    },
    { type: 'fields', title: 'Join contract' },
    {
      title: 'Before you join',
      bullets: [
        'Choose `inner` when unmatched rows should disappear. Choose `left` when the left table defines the cohort.',
        'Watch many-to-many relationships. Rime allows them, but they create one output row for every matching pair.',
        'If keys need normalization, an upstream `derive` node often makes the matching logic easier to review than expression keys inside the join.'
      ]
    },
    {
      title: 'Result shape',
      paragraphs: [
        '`default` is the joined table. Right-side column names are suffixed when needed to avoid collisions.',
        'The editor/report should make left-vs-right order and row-count expansion visible.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: [
        '- [derive](/nodes/derive/) - normalize keys before joining',
        '- [Expression language](/concepts/expressions/) - expression join keys'
      ]
    }
  ],
  pivot: [
    {
      paragraphs: [
        '`pivot` turns tidy/long data into a wide summary table. Index columns stay as row identity; distinct values from one column become output columns.',
        'It is useful for crosstabs and compact comparison tables. It is also one of the easiest nodes to make unreadable if the pivot column has too many distinct values.'
      ]
    },
    { type: 'fields', title: 'Pivot contract' },
    {
      title: 'What each cell means',
      bullets: [
        '`values` supplies the numeric value for each cell.',
        '`agg` decides how multiple rows in the same bucket collapse. The default is `sum`; use `mean` or `count` when that is the actual question.',
        'Empty buckets become null for `sum` and `mean`; `count` returns counts.'
      ]
    },
    {
      title: 'Reviewing the result',
      paragraphs: [
        '`default` is the pivoted wide table. Inspect total width and the generated column names before sending it to reports or scripts.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [aggregate](/nodes/aggregate/) - grouped summaries without widening']
    }
  ],
  concat: [
    {
      paragraphs: [
        '`concat` stacks peer tables row-wise and adds a label column that records where each row came from.',
        'It is most useful when two or more branches represent comparable cohorts, batches, sites, or time slices and you want one tidy table downstream.'
      ]
    },
    { type: 'fields', title: 'Stacking contract' },
    {
      title: 'Schema mode is the decision',
      bullets: [
        '`strict` requires the same column set and is safest when tables should match exactly.',
        '`intersect` keeps only shared columns and can silently drop useful fields if you are not looking.',
        '`union` keeps all columns and fills missing cells with null, which is flexible but should be followed by null-profile review.'
      ]
    },
    {
      title: 'Result shape',
      paragraphs: [
        '`default` is the combined table with the added `groupColumn`. Check that the labels are readable, because those values often become filters or group names later.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [t_test](/nodes/t_test/) - grouped tests often start by concatenating two cohorts']
    }
  ],
  t_test: [
    {
      paragraphs: [
        '`t_test` compares the mean of one numeric outcome across two named groups in one tidy table. It returns a statistical object, not a transformed table.',
        'Use it when a mean comparison is the honest question and the data is roughly compatible with a t-test story. If the outcome is ordinal, heavily skewed, or dominated by outliers, consider `mann_whitney_u` or a custom Python/R node.'
      ]
    },
    { type: 'fields', title: 'Test contract' },
    {
      title: 'How to read the result',
      paragraphs: [
        '`default` reports group sizes, group means, mean difference, t statistic, degrees of freedom, p-value, a 95% confidence interval, and effect size.',
        '`equalVariance: false` uses Welch-style unequal-variance standard errors. The schema default is `true`, so set it deliberately when variances may differ.'
      ]
    },
    {
      title: 'Warnings that matter',
      bullets: [
        'Small groups, non-normal shape, outlier rates, and high variance ratios can all produce warnings.',
        '`TT_VARIANCE_RATIO_HIGH` only fires for the equal-variance variant, because that is where unequal variances undercut the assumption.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: [
        '- [concat](/nodes/concat/) - stack two cohorts before testing',
        '- [mann_whitney_u](/nodes/mann_whitney_u/) - rank-based alternative'
      ]
    }
  ],
  anova: [
    {
      paragraphs: [
        '`anova` is the multi-group mean-comparison node. It asks whether at least one group mean differs from the others.',
        'It is not a pairwise explanation tool. A significant F-test tells you the groups are not all behaving alike; it does not tell you which pair caused the result.'
      ]
    },
    { type: 'fields', title: 'Test contract' },
    {
      title: 'How to read the result',
      paragraphs: [
        '`default` includes group summaries, between/within degrees of freedom, the F statistic, p-value, and effect size.',
        'Use `groupLabels` when group order or display names matter in a report.'
      ]
    },
    {
      title: 'Assumptions and follow-up',
      bullets: [
        'Watch sample-size, shape, outlier, and variance-ratio warnings next to the result.',
        'Plan follow-up pairwise `t_test` nodes only for comparisons you can justify, not every possible pair by reflex.',
        'For a non-parametric multi-group alternative, use a Python/R node for Kruskal-Wallis or permutation testing.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [t_test](/nodes/t_test/) - planned pairwise mean comparisons']
    }
  ],
  mann_whitney_u: [
    {
      paragraphs: [
        '`mann_whitney_u` compares two groups by rank ordering the outcome values. It is the built-in escape from a shaky mean/normality story.',
        'Use it for skewed continuous values, ordinal scores, or outlier-heavy groups when a rank-based comparison is easier to defend than a mean comparison.'
      ]
    },
    { type: 'fields', title: 'Rank-test contract' },
    {
      title: 'What question it answers',
      paragraphs: [
        '`default` reports group sizes, U, z, p-value, effect size, and a 95% effect-size confidence interval.',
        'The null is rank/stochastic balance: values from group A are not systematically larger or smaller than values from group B. Do not describe it as a guaranteed median test when the distributions have different shapes.'
      ]
    },
    {
      title: 'Limits',
      bullets: [
        'The current assumption-warning pass does not emit Mann-Whitney-specific warnings yet.',
        'Very small groups make the asymptotic p-value fragile. Use an exact, permutation, or bootstrap approach in Python/R when that distinction matters.',
        'Both requested groups must exist and have numeric values before the node can produce a result.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [t_test](/nodes/t_test/) - mean-based alternative when assumptions are credible']
    }
  ],
  chi_square: [
    {
      paragraphs: [
        '`chi_square` builds a contingency table from two categorical columns and tests whether the observed counts depart from independence.',
        'Use it when the question is about association between categories: site by outcome band, treatment by response class, product by region.'
      ]
    },
    { type: 'fields', title: 'Count-test contract' },
    {
      title: 'How to read the result',
      paragraphs: [
        '`default` includes the tested columns, n, degrees of freedom, chi-square statistic, p-value, and effect size.',
        'A significant result means the variables are not independent. It does not identify which cells are responsible, so inspect the contingency table or residuals in a follow-up node if needed.'
      ]
    },
    {
      title: 'Expected counts',
      bullets: [
        '`CHI_SQUARE_EXPECTED_CELL_TOO_LOW` is critical when any expected cell count is below 1.',
        '`CHI_SQUARE_EXPECTED_CELL_LOW_FREQUENCY` warns when more than 20% of expected cells are below 5.',
        'For small 2x2 cases where approximation quality matters, use Fisher exact in Python/R.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [Reports](/concepts/reports/) - warning callouts in generated reports']
    }
  ],
  correlation: [
    {
      paragraphs: [
        '`correlation` is a compact association check between two numeric columns. It is evidence for relationship, not a model of cause.',
        'Use Pearson when a linear relationship is the question. Use Spearman when rank order or monotonic movement is more believable than raw linearity.'
      ]
    },
    { type: 'fields', title: 'Association contract' },
    {
      title: 'How to read the result',
      paragraphs: [
        '`default` reports method, paired n, coefficient, p-value, effect size, and a 95% coefficient confidence interval.',
        'Pearson/Spearman disagreement can be more useful than either number alone because it often points to outliers or non-linear shape.'
      ]
    },
    {
      title: 'Watch for',
      bullets: [
        '`CORRELATION_SAMPLE_SMALL` appears when n is below 20.',
        '`CORRELATION_PEARSON_OUTLIER_SENSITIVE` appears when Pearson and Spearman differ by at least 0.2.',
        'If you need a directional fitted relationship, move to `linear_regression`; if you need controls or nonlinear features, use Python/R.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [linear_regression](/nodes/linear_regression/) - model a directional single-feature relationship']
    }
  ],
  linear_regression: [
    {
      paragraphs: [
        '`linear_regression` fits one ordinary least squares line: one numeric feature, one numeric target.',
        'It is intentionally small. Use it for a reportable single-feature relationship, not as a substitute for a modeling workflow.'
      ]
    },
    { type: 'fields', title: 'Model contract' },
    {
      title: 'How to read the result',
      paragraphs: [
        '`default` includes n, slope, intercept, r2, p-value, a 95% slope confidence interval, and effect size.',
        '`testFraction` can reserve a deterministic holdout split. Add `seed` when you want that split to be repeatable.'
      ]
    },
    {
      title: 'When not to use it',
      bullets: [
        'Multiple predictors, interactions, robust standard errors, diagnostics, and nonlinear models belong in Python/R.',
        '`LINEAR_REGRESSION_SAMPLE_SMALL` appears when n is below 20.',
        '`LINEAR_REGRESSION_HIGH_RESIDUAL_OUTLIERS` warns when at least 5% of observations have residuals at or beyond 3 residual standard deviations.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [correlation](/nodes/correlation/) - lighter-weight association check']
    }
  ],
  subgraph: [
    {
      paragraphs: [
        '`subgraph` wraps another `.dag.yaml` file behind an explicit boundary. From the parent DAG, the inner pipeline behaves like one composed node.',
        'Use it when a cluster of steps has a reusable contract: a feature pipeline, a standardized cleaning pass, or a shared project module.'
      ]
    },
    { type: 'fields', title: 'Boundary contract' },
    {
      title: 'Bindings and outputs',
      bullets: [
        '`bindings` maps names expected inside the sub-DAG to refs in the parent DAG.',
        '`outputs` maps public output names to inner node refs.',
        'The subgraph is intentionally opaque from the outside. That is useful for encapsulation, but it makes the boundary names important documentation.'
      ]
    },
    {
      title: 'Editor behavior',
      paragraphs: [
        'Condense/expand UI should preserve external refs and make bindings inspectable. Structured violations include `EMPTY_SELECTION`, `UNKNOWN_NODE_ID`, `NON_CONVEX`, `CONTAINS_SOURCE`, and `UNRESOLVED_REF`.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: ['- [Concepts: DAG specification](/concepts/dag/) - how refs and DAG boundaries work']
    }
  ],
  html: [
    {
      paragraphs: [
        '`html` packages a project HTML file as a cached output. Rime does not render the page during the run; it injects a JSON payload, writes the HTML artifact, and lets the generated report embed it in an iframe.',
        'Use it when the report needs a custom browser-side visualization or interactive narrative, but the data and cache boundary should still be owned by the DAG.'
      ]
    },
    { type: 'fields', title: 'Artifact contract' },
    {
      title: 'Input payload',
      paragraphs: [
        '`in` is a named map from payload slot to a node ref, named output ref, or `params.name` scalar. Table refs become arrays of row objects; scalar params keep their scalar values.',
        'The runtime injects one inert JSON script tag into the HTML: `<script type="application/json" id="rime-inputs">...</script>`. Browser-side code reads and parses that tag when the report or artifact opens.'
      ]
    },
    {
      title: 'Output behavior',
      bullets: [
        '`default` is an `html_artifact` written to `outputs/<nodeId>/default.html`.',
        'Auto reports render the artifact in an iframe output cell.',
        'The HTML source file is part of the cache key, so editing markup, CSS, or browser-side JS reruns the node.'
      ]
    },
    {
      title: 'When not to use it',
      bullets: [
        'Use `rime build` alone when the standard DAG report is enough.',
        'Use a JavaScript language node when the HTML itself must be generated programmatically from code instead of authored as a file.',
        'Use an external browser test when you need accessibility, visual regression, or screenshot assertions; Rime only writes the artifact.'
      ]
    },
    { type: 'example' },
    {
      type: 'related',
      links: [
        '- [HTML output](/scripts/html/) - report output paths and JavaScript-generated alternatives',
        '- [Reports](/concepts/reports/) - how `html_artifact` outputs render in reports',
        '- [Outputs & caching](/concepts/outputs/) - where artifact files are written'
      ]
    }
  ],
  script: [
    {
      paragraphs: [
        'Language nodes are the escape hatch: `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql`. The YAML declares slots and outputs; the language owns the computation.',
        'Use one when the built-in nodes would hide the real logic, or when you need a package, query, model, visualization, custom file output, or multiple named outputs.'
      ]
    },
    { type: 'fields', title: 'Slot contract' },
    {
      title: 'Inputs and outputs',
      paragraphs: [
        '`in` is a named map from function/query slot to a node ref, named output ref, or `params.name` scalar. Empty `in` is allowed for ingress scripts.',
        '`out` can declare multiple named outputs. When omitted, the node uses the language manifest or the default output.'
      ]
    },
    {
      title: 'Choosing the language',
      bullets: [
        'Use SQL for DuckDB-backed joins, scans, and relational transforms.',
        'Use Python/R for statistics, modeling, plotting, or libraries Rime should not rebuild as core nodes.',
        'Use JavaScript when the project already has JS utilities or when output shaping is easier near web/report code.'
      ]
    },
    {
      title: 'Runtime failure modes',
      bullets: [
        'A language node without `source` fails at run time.',
        'If script execution is disabled or no executor is registered for the language, the node fails with `NODE_UNSUPPORTED`.',
        'Multi-output declarations must match what the script actually returns.'
      ]
    },
    { type: 'example', title: 'Named-slot example' },
    {
      type: 'related',
      links: [
        '- [Python language nodes](/scripts/python/) - pandas-based transforms',
        '- [R language nodes](/scripts/r/) - data.frame/tibble-style transforms',
        '- [JavaScript language nodes](/scripts/javascript/) - `defineNode` and row-array transforms',
        '- [SQL language nodes](/scripts/sql/) - DuckDB-backed transforms'
      ]
    }
  ]
};

function renderPageSection(section, meta, yaml) {
  if (section.type === 'fields') {
    return renderFieldTable(meta.kind, section.title);
  }

  if (section.type === 'example') {
    const fallback =
      '> Example pending - see [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) in the upstream repo for the field list.';
    return `\n## ${section.title ?? 'Example'}\n\n${yaml ? '```yaml\n' + yaml + '\n```' : fallback}\n`;
  }

  if (section.type === 'related') {
    if (!section.links || section.links.length === 0) return '';
    return `\n## Related\n\n${section.links.join('\n')}\n`;
  }

  const parts = [];
  if (section.paragraphs) parts.push(section.paragraphs.join('\n\n'));
  if (section.bullets) parts.push(section.bullets.map((item) => `- ${item}`).join('\n'));
  if (section.body) parts.push(section.body);

  const text = parts.join('\n\n').trim();
  if (!text) return '';
  return section.title ? `\n## ${section.title}\n\n${text}\n` : `\n${text}\n`;
}

function renderNodePage(meta, yaml) {
  const sections = NODE_PAGE_SECTIONS[meta.kind];
  if (!sections) throw new Error(`Missing custom node reference sections for ${meta.kind}`);
  return sections.map((section) => renderPageSection(section, meta, yaml)).join('');
}

let written = 0;
for (const meta of KINDS) {
  const refBody = refByKind.get(meta.kind);
  const yaml = extractYamlExample(refBody) ?? meta.example;

  // YAML-safe quote: wrap in double quotes, escape any internal double quotes.
  const yamlString = (s) => `"${s.replace(/"/g, '\\"')}"`;
  const pageBody = renderNodePage(meta, yaml);

  const content = `---
title: ${meta.title ?? meta.kind}
description: ${yamlString(meta.blurb)}
---

${pageBody}
`
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';

  await writeFile(path.join(OUT_DIR, `${meta.kind}.md`), content);
  written += 1;
}

console.log(`generate-node-reference: wrote ${written} pages to ${path.relative(process.cwd(), OUT_DIR)}/`);
