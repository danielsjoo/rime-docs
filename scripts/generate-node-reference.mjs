#!/usr/bin/env node
// Generate per-node-kind reference pages under src/content/docs/nodes/
// from the canonical NODE_REFERENCE.md at the repo root.
//
// Strategy: parse NODE_REFERENCE.md, split on per-kind headings, emit one
// Markdown file per kind with Starlight frontmatter. Falls back gracefully
// if a kind has no dedicated section.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REF_PATH = path.join(ROOT, 'NODE_REFERENCE.md');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'content', 'docs', 'nodes');

// Canonical kind list — keep in sync with packages/core/src/schema.ts
const KINDS = [
  { kind: 'source', blurb: 'File-based ingress (CSV / JSON / NDJSON / Parquet).' },
  { kind: 'filter', blurb: 'Keep rows matching a boolean expression.' },
  { kind: 'derive', blurb: 'Add a computed column from existing columns.' },
  { kind: 'aggregate', blurb: 'Group rows and reduce with named metrics.' },
  { kind: 'select', blurb: 'Keep a subset of columns.' },
  { kind: 'sort', blurb: 'Order rows by one or more expressions.' },
  { kind: 'join', blurb: 'Two-input inner / left join on column keys.' },
  { kind: 'pivot', blurb: 'Wide-format aggregation across a categorical column.' },
  { kind: 'concat', blurb: 'Stack tables row-wise with a label column.' },
  { kind: 't_test', blurb: 'Two-sample t-test (Welch or equal-variance).' },
  { kind: 'anova', blurb: 'One-way ANOVA across N groups.' },
  { kind: 'mann_whitney_u', blurb: 'Non-parametric two-sample test.' },
  { kind: 'chi_square', blurb: 'Categorical independence test.' },
  { kind: 'correlation', blurb: 'Pearson / Spearman correlation between two columns.' },
  { kind: 'linear_regression', blurb: 'Single-feature OLS, optional train/test split.' },
  { kind: 'subgraph', blurb: 'Embed an external DAG file with named bindings + outputs.' },
  { kind: 'script', blurb: 'Custom logic in Python / R / JavaScript / SQL.' }
];

const md = await readFile(REF_PATH, 'utf8');

await mkdir(OUT_DIR, { recursive: true });

// Split on `## ` or `### ` headings that name a kind (in backticks).
// e.g. "## `source` — file-based ingress" or "### `t_test`"
const headingRe = /^(##|###)\s+`([a-z_]+)`/gm;
const sections = [];
let match;
let lastIdx = 0;
let lastKind = null;
let lastStart = 0;

while ((match = headingRe.exec(md)) !== null) {
  if (lastKind) {
    sections.push({ kind: lastKind, body: md.slice(lastStart, match.index).trim() });
  }
  lastKind = match[2];
  lastStart = match.index;
  lastIdx = match.index;
}
if (lastKind) {
  // Last section extends to end (or to "Removed in v2" / "Metadata" footer)
  const tail = md.slice(lastStart);
  const cutAt = tail.search(/\n##\s+(Removed in v2|Metadata|Reference)\b/);
  sections.push({
    kind: lastKind,
    body: (cutAt >= 0 ? tail.slice(0, cutAt) : tail).trim()
  });
}

const sectionByKind = new Map(sections.map((s) => [s.kind, s.body]));

let written = 0;
for (const { kind, blurb } of KINDS) {
  const body = sectionByKind.get(kind);
  let content;
  if (body) {
    // Re-shape: strip the original heading, keep everything else.
    const stripped = body.replace(/^(##|###)\s+`[a-z_]+`[^\n]*\n+/, '');
    content = `---
title: "\`${kind}\`"
description: ${blurb}
---

${stripped}
`;
  } else {
    content = `---
title: "\`${kind}\`"
description: ${blurb}
---

> Reference content for \`${kind}\` is being filled in. See the canonical schema in [\`packages/core/src/schema.ts\`](https://github.com/rimekit/rime/blob/main/packages/core/src/schema.ts) for the full field list.

${blurb}
`;
  }

  const out = path.join(OUT_DIR, `${kind}.md`);
  await writeFile(out, content);
  written += 1;
}

console.log(`generate-node-reference: wrote ${written} pages to ${path.relative(process.cwd(), OUT_DIR)}/`);
