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
    kind: 'script',
    title: 'language nodes',
    blurb: 'Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits.',
    inputs: 'Variable — declare named slots in `in:`. Each slot can be a dataframe ref or a `params.*` reference.',
    outputs: '`default` by default, or multiple named outputs declared in `out:`.',
    whenToUse: 'When the 14 core nodes don\'t cover your transform. See the per-language pages — [Python](/rime-docs/scripts/python/), [R](/rime-docs/scripts/r/), [JavaScript](/rime-docs/scripts/javascript/), [SQL](/rime-docs/scripts/sql/) — for function-signature details.',
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

const MENTAL_MODEL_BY_KIND = {
  source:
    'A `source` node is the boundary between external bytes and the Rime DAG. After the source loads, downstream nodes should treat the data as a typed table owned by the runtime.',
  filter:
    'A `filter` node is a row gate. It keeps the same schema and changes only the set of rows, which makes it ideal for cohorts, quality gates, and thresholds.',
  derive:
    'A `derive` node adds one named feature column. Chain several derives when you want an inspectable feature-building trail instead of one opaque script.',
  aggregate:
    'An `aggregate` node turns many rows into one row per group, or one global summary row when `groupBy: []`.',
  select:
    'A `select` node is a projection. It narrows a table to the columns, aliases, or expressions that downstream work should see.',
  sort:
    'A `sort` node changes row order without changing values. Use it when order matters for review, reports, or deterministic downstream sampling.',
  join:
    'A `join` node combines two tables. The left input is the anchor, especially for `how: left`, and the right input enriches it.',
  pivot:
    'A `pivot` node makes a long table wide: index columns define rows, a categorical column becomes output columns, and one value column is aggregated into each cell.',
  concat:
    'A `concat` node stacks peer tables row-wise and adds a group label. It is the clean way to turn separate cohorts into one tidy table for later stats.',
  t_test:
    'A `t_test` node consumes one tidy table and emits a stat object, not another table. It compares two named groups inside one `groupColumn`.',
  anova:
    'An `anova` node is the multi-group sibling of `t_test`: one continuous outcome, one grouping column, and an overall F-test across groups.',
  mann_whitney_u:
    'A `mann_whitney_u` node compares two groups by ranks rather than raw means. It is useful when the mean/normality story is not credible.',
  chi_square:
    'A `chi_square` node builds a contingency table from two categorical columns, then tests whether their observed counts depart from independence.',
  correlation:
    'A `correlation` node summarizes pairwise association between two numeric columns. It is exploratory evidence, not a causal model.',
  linear_regression:
    'A `linear_regression` node fits a single-predictor OLS line and emits coefficients, uncertainty, and fit statistics for a compact report callout.',
  subgraph:
    'A `subgraph` node is a pipeline boundary. It hides an external DAG behind explicit bindings and exposed outputs.',
  script:
    'A language node is the escape hatch. The YAML declares slots and outputs; Python, R, JavaScript, or SQL owns the computation.'
};

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
  script: [
    ['`kind`', 'yes', '`python`, `r`, `javascript`, or `sql`. Legacy `kind: script` also carries `language`.'],
    ['`source`', 'run-time required', 'Project-relative script/query path. The editor can create an unfinished node, but a run needs a source file.'],
    ['`in`', 'no', 'Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`.'],
    ['`out`', 'no', 'Declared output map or list. Omit for the manifest/default output.'],
    ['`entrypoint`', 'no', 'Function/export name for languages that need one.']
  ]
};

const OUTPUT_DETAILS_BY_KIND = {
  t_test:
    '`default`: an object with `type`, `valueColumn`, `groupColumn`, `groupA`, `groupB`, `equalVariance`, `nA`, `nB`, `meanA`, `meanB`, `mean_diff`, `t_statistic`, `dof`, `p_value`, `mean_diff_ci_95`, and `effect_size`.',
  anova:
    '`default`: an object with `type`, `valueColumn`, `groupColumn`, `n`, `groups`, `df_between`, `df_within`, `f_statistic`, `p_value`, and `effect_size`.',
  mann_whitney_u:
    '`default`: an object with `type`, `valueColumn`, `groupColumn`, `groupA`, `groupB`, `nA`, `nB`, `u`, `z`, `p_value`, `effect_size`, and `effect_size_ci_95`.',
  chi_square:
    '`default`: an object with `type`, `columnA`, `columnB`, `n`, `dof`, `chi_square`, `p_value`, and `effect_size`.',
  correlation:
    '`default`: an object with `type`, `columnA`, `columnB`, `method`, `n`, `coefficient`, `t_statistic`, `p_value`, `effect_size`, and `coefficient_ci_95`.',
  linear_regression:
    '`default`: an object with `type`, `feature`, `target`, `n`, `slope`, `intercept`, `r2`, `p_value`, `slope_ci_95`, and `effect_size`.'
};

const EXPRESSION_NOTES_BY_KIND = {
  filter: [
    '`expr` uses the Rime expression language and must evaluate to a boolean per row.',
    'Use bracketed column refs (`[age]`) and plain literals (`18`, `"active"`, `true`, `null`).',
    'Aggregate methods like `.mean()` are not meaningful in a row filter; compute summaries upstream with `aggregate`.'
  ],
  derive: [
    '`expr` uses the Rime expression language and is compiled to Polars.',
    'Use functions like `coalesce([score], 0)` for null-safe feature engineering.',
    'The node aliases the result to `as`, so the expression itself does not need an alias assignment.'
  ],
  aggregate: [
    '`groupBy` entries and `metrics` entries use the Rime expression language.',
    'Metrics should be alias expressions: `"[mean_score] = [score].mean()"`.',
    'Common reducers include `.sum()`, `.mean()`, `.count()`, `.min()`, `.max()`, `.n_unique()`, and `.distinct()`.'
  ],
  select: [
    '`columns` are schema-limited to identifier-shaped strings today, but runtime projection compiles them as expressions.',
    'For derived expressions with clear names, prefer an upstream `derive` followed by `select` for readability.'
  ],
  sort: [
    '`by[].expr` uses the Rime expression language, so you can sort by computed keys such as `[last_name].lowercase()` or `[score] * -1`.',
    'Prefer explicit `direction: desc` over negating numeric expressions when the intent is simple descending order.'
  ],
  join: [
    '`leftKey` and `rightKey` can be bare column names. If the value is not a bare identifier, it is parsed as an expression.',
    'Expression join keys are useful for normalized identifiers, but they can hide expensive or lossy matching logic; give those nodes clear labels.'
  ]
};

const EDITOR_NOTES_BY_KIND = {
  source: [
    'The editor should show the bound path, inferred shape, column profiles, and sampled rows immediately after a run.',
    'If the path is missing, the app should disable run-dependent preview rather than making the user probe manually.'
  ],
  filter: [
    'The selected node preview should make row-count change obvious: input rows vs output rows is the main story.',
    'Warnings or errors should point at the expression, not the whole node.'
  ],
  derive: [
    'The table preview should highlight the new `as` column so reviewers can inspect the feature quickly.',
    'For numerical features, column profile deltas are often more useful than a large row sample.'
  ],
  aggregate: [
    'The preview should lead with the output shape because aggregation usually collapses rows.',
    'Metric names should be visible as output columns; unreadable aliases are a smell.'
  ],
  select: [
    'The preview should feel like a schema check: columns kept, columns dropped, and final ordering.',
    'This node is a good place for the editor to warn about accidental over-wide downstream tables.'
  ],
  sort: [
    'The preview should show the first rows after sorting and the sort keys used.',
    'Sort nodes are often invisible in row/column counts, so the UI needs to make the ordering decision explicit.'
  ],
  join: [
    'The editor should show both parent inputs and make left/right order clear.',
    'Row-count expansion after a join is worth surfacing because many-to-many matches can explode silently.'
  ],
  pivot: [
    'The preview should show the new wide columns and total width; high-cardinality pivots can become unreadable fast.',
    'The editor should make `agg` visible because it changes the meaning of every pivoted cell.'
  ],
  concat: [
    'The preview should show the added `groupColumn` and each label value.',
    'Schema mode should be prominent because `strict`, `intersect`, and `union` have very different review implications.'
  ],
  t_test: [
    'In reports, this renders as a stat object rather than a table. Surface `p_value`, `mean_diff`, confidence interval, and warnings together.',
    'In the editor, show the two group sizes before the statistic; a significant p-value with tiny groups should feel suspicious.'
  ],
  anova: [
    'Report output should show the F statistic, p-value, effect size, degrees of freedom, and per-group means.',
    'Group sample sizes and warnings belong next to the result, not hidden below the fold.'
  ],
  mann_whitney_u: [
    'Report output should show U, z, p-value, effect size, confidence interval, and group sizes.',
    'Because this is rank-based, the surrounding docs/UI should avoid saying it directly tests medians in all cases.'
  ],
  chi_square: [
    'Report output should make the tested columns and Cramer’s V/effect size visible.',
    'When expected counts are low, warnings should be hard to miss because the p-value approximation can be invalid.'
  ],
  correlation: [
    'Report output should show method, coefficient, p-value, n, and the coefficient confidence interval.',
    'If Pearson and Spearman disagree, the warning is often the most important part of the node.'
  ],
  linear_regression: [
    'Report output should show slope, intercept, r2, p-value, confidence interval, effect size, and outlier warnings.',
    'The editor should be clear this is single-feature OLS, not a general modeling workbench.'
  ],
  subgraph: [
    'The editor should render subgraphs as boxed composition, with clear exposed inputs/outputs.',
    'Condense/expand should preserve external references and make boundary bindings inspectable.'
  ],
  script: [
    'The editor should show named slots as real edges and show the source file beside the selected node preview.',
    'Multiple outputs should be visible as named outputs in both the canvas and report.'
  ]
};

const WARNING_NOTES_BY_KIND = {
  source: [
    'Missing source values surface as `NODE_INPUT_MISSING` at run time.',
    'CSV cells are converted to primitive number/boolean/string values when possible; empty cells become null.'
  ],
  filter: [
    'Expression parse or evaluation errors fail the node and skip downstream dependents.',
    'A filter that returns zero rows is valid, but downstream stats may fail because they have too few observations.'
  ],
  derive: [
    'Unsupported expression functions fail as `NODE_EXECUTION` errors from the compiler/runtime.',
    'Deriving over nulls follows Polars semantics; use `coalesce()` when nulls should become a default value.'
  ],
  aggregate: [
    'Metrics without aliases produce hard-to-read output columns; use alias expressions for report-quality results.',
    'Global aggregation (`groupBy: []`) is valid and should produce one row.'
  ],
  join: [
    'Many-to-many joins are allowed; watch row counts for unplanned Cartesian expansion.',
    'Expression keys are powerful but can mask type coercion. Prefer explicit upstream `derive` nodes when reviewers need to inspect the key.'
  ],
  pivot: [
    'Only finite numeric values contribute to `sum` and `mean` cells; empty buckets become null except `count`, which returns counts.',
    'High-cardinality `columns` values create very wide output tables.'
  ],
  concat: [
    '`strict` schema mode fails when inputs do not share the same column set.',
    '`union` fills missing columns with null; use it deliberately and inspect null profiles afterward.'
  ],
  t_test: [
    'Warnings include `TT_GROUP_SAMPLE_VERY_SMALL`, `TT_GROUP_SAMPLE_SMALL`, `TT_GROUP_NON_NORMAL_SHAPE`, `TT_GROUP_OUTLIER_RATE_MODERATE`, `TT_GROUP_OUTLIER_RATE_HIGH`, and `TT_VARIANCE_RATIO_HIGH`.',
    '`TT_VARIANCE_RATIO_HIGH` only applies when `equalVariance: true` and the group variance ratio is at least 4.'
  ],
  anova: [
    'Warnings include `ANOVA_GROUP_SAMPLE_VERY_SMALL`, `ANOVA_GROUP_SAMPLE_SMALL`, `ANOVA_GROUP_NON_NORMAL_SHAPE`, `ANOVA_GROUP_OUTLIER_RATE_MODERATE`, `ANOVA_GROUP_OUTLIER_RATE_HIGH`, and `ANOVA_VARIANCE_RATIO_HIGH`.',
    '`ANOVA_VARIANCE_RATIO_HIGH` fires when group variances differ by at least 4x.'
  ],
  mann_whitney_u: [
    'The current assumption-warning pass does not emit Mann-Whitney-specific warnings yet.',
    'The node still validates that both requested groups have numeric values before producing a result.'
  ],
  chi_square: [
    '`CHI_SQUARE_EXPECTED_CELL_TOO_LOW` is critical when any expected cell count is below 1.',
    '`CHI_SQUARE_EXPECTED_CELL_LOW_FREQUENCY` warns when more than 20% of expected cells are below 5.'
  ],
  correlation: [
    '`CORRELATION_SAMPLE_SMALL` is informational when n is below 20.',
    '`CORRELATION_PEARSON_OUTLIER_SENSITIVE` warns when Pearson and Spearman differ by at least 0.2.'
  ],
  linear_regression: [
    '`LINEAR_REGRESSION_SAMPLE_SMALL` is informational when n is below 20.',
    '`LINEAR_REGRESSION_HIGH_RESIDUAL_OUTLIERS` warns when at least 5% of observations have residuals at or beyond 3 residual standard deviations.'
  ],
  subgraph: [
    'Subgraph editing helpers report structured violations such as `EMPTY_SELECTION`, `UNKNOWN_NODE_ID`, `NON_CONVEX`, `CONTAINS_SOURCE`, and `UNRESOLVED_REF`.',
    'The runtime executes subgraphs through the engine, not the leaf node executor.'
  ],
  script: [
    'A script node without `source` fails with `NODE_PARAM_INVALID` at run time.',
    'If script execution is disabled or no executor is registered for the language, the node fails with `NODE_UNSUPPORTED`.'
  ]
};

const MODELING_NOTES_BY_KIND = {
  t_test: [
    'Use one tidy table with a grouping column instead of two separate inputs.',
    'Use `concat` to stack two cohorts first when the cohorts start in separate branches.'
  ],
  anova: [
    'ANOVA answers whether at least one group mean differs; it does not identify which pair differs.',
    'Follow with planned pairwise `t_test` nodes only for comparisons you can justify.'
  ],
  mann_whitney_u: [
    'Mann-Whitney is a rank/stochastic-dominance test. It is not automatically a “median test” when distributions have different shapes.'
  ],
  chi_square: [
    'A significant result means the variables are not independent; inspect the contingency table to understand which cells drive the result.'
  ],
  correlation: [
    'Pearson measures linear association. Spearman ranks first and is better for monotonic but non-linear relationships.'
  ],
  linear_regression: [
    'This node is intentionally small: one predictor, one target. Use a Python/R node for multi-feature models, robust errors, or diagnostics beyond the built-in warnings.'
  ]
};

const SEE_ALSO_BY_KIND = {
  filter: ['- [Expression language](/rime-docs/concepts/expressions/) — syntax for `expr`'],
  derive: ['- [Expression language](/rime-docs/concepts/expressions/) — syntax for `expr`'],
  aggregate: ['- [Expression language](/rime-docs/concepts/expressions/) — group and metric expressions'],
  select: ['- [Expression language](/rime-docs/concepts/expressions/) — projection expression syntax'],
  sort: ['- [Expression language](/rime-docs/concepts/expressions/) — sort key expressions'],
  join: ['- [Expression language](/rime-docs/concepts/expressions/) — expression join keys'],
  t_test: ['- [concat](/rime-docs/nodes/concat/) — stack cohorts before running a grouped test'],
  anova: ['- [t_test](/rime-docs/nodes/t_test/) — pairwise follow-up comparisons'],
  mann_whitney_u: ['- [t_test](/rime-docs/nodes/t_test/) — mean-based alternative when assumptions are credible'],
  chi_square: ['- [Reports](/rime-docs/concepts/reports/) — warning callouts in generated reports'],
  correlation: ['- [linear_regression](/rime-docs/nodes/linear_regression/) — model a directional relationship'],
  linear_regression: ['- [correlation](/rime-docs/nodes/correlation/) — lighter-weight association check'],
  script: [
    '- [Python language nodes](/rime-docs/scripts/python/) — pandas-based transforms',
      '- [R language nodes](/rime-docs/scripts/r/) — data.frame/tibble-style transforms',
      '- [JavaScript language nodes](/rime-docs/scripts/javascript/) — defineNode and row-array transforms',
    '- [SQL language nodes](/rime-docs/scripts/sql/) — DuckDB-backed transforms'
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

function renderList(items) {
  if (!items || items.length === 0) return '';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderSection(title, body) {
  if (!body) return '';
  const text = Array.isArray(body) ? renderList(body) : body;
  if (!text.trim()) return '';
  return `\n## ${title}\n\n${text}\n`;
}

function escapeTableCell(value) {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />');
}

function renderFieldTable(kind) {
  const rows = FIELD_ROWS_BY_KIND[kind];
  if (!rows || rows.length === 0) return '';
  const body = rows
    .map(([field, required, notes]) => `| ${field} | ${required} | ${escapeTableCell(notes)} |`)
    .join('\n');
  return `\n## Fields\n\n| Field | Required | Notes |\n| --- | --- | --- |\n${body}\n`;
}

function renderSeeAlso(meta) {
  const local = SEE_ALSO_BY_KIND[meta.kind] ?? [];
  const languageLinks =
    meta.kind === 'script'
      ? local
      : ['- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough'];
  return [
    ...languageLinks,
    ...(meta.kind === 'script' ? [] : local),
    '- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system',
    '- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema'
  ].join('\n');
}

let written = 0;
for (const meta of KINDS) {
  const refBody = refByKind.get(meta.kind);
  const yaml = extractYamlExample(refBody) ?? meta.example;

  const modelingNotes = [...(meta.pitfalls ?? []), ...(MODELING_NOTES_BY_KIND[meta.kind] ?? [])];
  const outputText = OUTPUT_DETAILS_BY_KIND[meta.kind] ?? meta.outputs;

  // YAML-safe quote: wrap in double quotes, escape any internal double quotes.
  const yamlString = (s) => `"${s.replace(/"/g, '\\"')}"`;

  const content = `---
title: ${meta.title ?? meta.kind}
description: ${yamlString(meta.blurb)}
---

${meta.blurb}
${renderSection('Mental model', MENTAL_MODEL_BY_KIND[meta.kind])}

## When to use

${meta.whenToUse}
${renderFieldTable(meta.kind)}

## Inputs

${meta.inputs}

## Outputs

${outputText}
${renderSection('Expression language', EXPRESSION_NOTES_BY_KIND[meta.kind])}
${renderSection('Editor and report behavior', EDITOR_NOTES_BY_KIND[meta.kind])}
${renderSection('Warnings and assumptions', WARNING_NOTES_BY_KIND[meta.kind])}

## Example

${yaml ? '```yaml\n' + yaml + '\n```' : '> Example pending — see [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) in the upstream repo for the field list.'}

## Modeling notes

${renderList(modelingNotes)}

## See also

${renderSeeAlso(meta)}
`.replace(/\n{3,}/g, '\n\n');

  await writeFile(path.join(OUT_DIR, `${meta.kind}.md`), content);
  written += 1;
}

console.log(`generate-node-reference: wrote ${written} pages to ${path.relative(process.cwd(), OUT_DIR)}/`);
