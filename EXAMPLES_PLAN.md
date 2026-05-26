# Examples — content plan

The homepage links to four example pages. Each currently exists as a stub. This file describes what each page should ship with, where its content/code lives in the upstream `rime` repo, and a porting recipe.

## How an example page should be structured

Every example page should have these sections in order:

1. **TL;DR** — 1 paragraph + a screenshot of the rendered HTML report (`output/report.html`).
2. **What you'll learn** — bulleted list of concepts demonstrated.
3. **Data** — what dataset, where it comes from (URL, fixture), size.
4. **The DAG** — annotated YAML, broken into chunks, with explanations per node.
5. **Running it** — the exact `git clone` + `rime run` commands.
6. **Walkthrough** — node-by-node prose for the interesting nodes.
7. **Generated report** — link to a hosted version + screenshots of report sections.
8. **Try it yourself** — suggested modifications (change a join, swap stat test, etc.).

Aim for ~600–1000 words per page plus screenshots. Less than 500 = too thin to be useful. More than 1500 = should be split.

---

## 1. `/examples/cars-emissions/` — flagship multi-language narrative

**Source:** `rime/packages/core/test/fixtures/experiments/cars-emissions-narrative/`
- DAG: `pipeline.dag.yaml`
- Description: `EXPERIMENT.md` (already has 80% of the content)
- Scripts: `queries/`, `scripts/`
- Outputs: `outputs/` (regenerate fresh)

**Demonstrates:**
- Four languages in one DAG (SQL via DuckDB, JS API fetch, Python UMAP embedding, R linear regression)
- Arrow-IPC dataframe handoff across language boundaries
- Statistical terminal nodes (`t_test`, `anova`) feeding `stat:` blocks in `report.yaml`
- A report with prose + tables + a UMAP scatter plot

**Porting recipe:**
1. Port the body of `EXPERIMENT.md` directly into `src/content/docs/examples/cars-emissions.md` (preserve the section structure).
2. Re-run the pipeline to regenerate `narrative.html` + capture screenshots of key sections.
3. Host `narrative.html` somewhere static (Cloudflare Pages, a `/examples/cars-emissions/report/` subdirectory) and link to it from the page.
4. Add a "Clone and run" block:
   ```bash
   git clone https://github.com/danielsjoo/rime
   cd rime/packages/core/test/fixtures/experiments/cars-emissions-narrative
   rime run pipeline.dag.yaml
   open outputs/narrative.html
   ```

**Estimated effort:** 2 hours (content mostly exists, just needs reshaping + screenshots).

---

## 2. `/examples/penguins/` — minimal teaching pipeline

**Source:** `rime/packages/core/test/fixtures/experiments/penguin/`
- DAG: small single-file pipeline
- Should demonstrate: source → filter → derive → aggregate → t_test → report

**Demonstrates:**
- The smallest interesting DAG (5–7 nodes)
- Each of the most common core nodes
- A basic `report.yaml` rendering one table + one stat

**Porting recipe:**
1. Inspect `rime/packages/core/test/fixtures/experiments/penguin/` for the actual DAG shape.
2. Write a step-by-step walkthrough where each section adds one more node:
   - "Step 1: load the data" → `source` node
   - "Step 2: filter to one species" → `filter` node
   - "Step 3: compute body mass index" → `derive` node
   - etc.
3. Show the report at the end.

**Estimated effort:** 3 hours (need to author the walkthrough narrative from scratch).

---

## 3. `/examples/headless/` — embed `@rimekit/runtime` in Node

**Source:** `rime/examples/headless-runner/`

**Demonstrates:**
- Using Rime programmatically from Node, not via the CLI
- Listening to run lifecycle events
- Capturing outputs to memory instead of writing to disk
- Use cases: CI plugins, custom dashboards, scheduling layers

**Porting recipe:**
1. Read `rime/examples/headless-runner/index.js` (or whatever the entry is).
2. Inline the relevant snippets into the docs page with explanation.
3. Show the `package.json` install line for `@rimekit/runtime` (once published).
4. Include 3 use-case sketches (CI plugin, custom UI, scheduled run via cron).

**Estimated effort:** 1.5 hours.

---

## 4. `/examples/sql-only/` — pure SQL pipeline via DuckDB

**Source:** `rime/examples/sql-source-duckdb/`

**Demonstrates:**
- SQL ingress mode (a SQL node with no `in:` reading external files via DuckDB)
- Multi-step SQL DAG without Python/R/JS
- The lightest setup possible — no language interpreters needed

**Porting recipe:**
1. Read `rime/examples/sql-source-duckdb/pipeline.dag.yaml`.
2. Explain DuckDB ingress mode (the `SELECT * FROM 'data.parquet'` pattern).
3. Show how to JOIN, aggregate, and report — all in SQL.
4. Contrast with the polyglot examples — "when SQL is enough."

**Estimated effort:** 1 hour.

---

## 5. Long-tail — port from fixtures

There are 14 more pipeline fixtures in `rime/packages/core/test/fixtures/experiments/` that could become examples (in rough priority order):

| Fixture | Why interesting |
|---|---|
| `citibike-linear-regression-analysis` | Real-world dataset, regression-focused |
| `retail-weather-cohort-analysis` | Multi-source join + cohort analysis |
| `hospital-weather-polyglot` | Healthcare use case, polyglot |
| `tips-t-test-analysis` | Classic stats teaching example |
| `tips-chi-square-analysis` | Categorical stats |
| `anova-tips-analysis` | ANOVA-specific |
| `mann-whitney-tips-analysis` | Non-parametric stats |
| `correlation-tips-analysis` | Correlation-specific |
| `expression-functions-tips` | Expression DSL deep-dive |
| `shaping-window-tips` | Window functions in `derive` |
| `retail-join-pivot-target` | Pivot + join complex case |
| `dag-ui-blocking-polyglot` | Editor-specific UI patterns |
| `cli-smoke-js-fetch` | CLI smoke test |
| `cli-smoke-js-sql` | CLI smoke test |

Don't port all of these — pick 2–3 more based on what gaps users actually have when reading the docs.

## Implementation order

1. **First:** Fix the 404s by writing the four stub pages so homepage links resolve.
2. **Then:** Port `cars-emissions` properly — it's the flagship.
3. **Then:** `penguins` — best teaching value.
4. **Then:** `headless` + `sql-only` — niche but cheap to ship.
5. **Eventually:** A handful from the long-tail.

## Shipping policy

- Stub pages can ship immediately (homepage links resolve, content is "coming soon").
- Real pages should ship only when they include: regenerated screenshots, working clone-and-run instructions, and a hosted `narrative.html`.
- Until that bar is met, the stub stays.
