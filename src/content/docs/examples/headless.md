---
title: Embed in Node
description: Use Rime programmatically from a Node script for CI plugins, custom dashboards, and headless execution.
---

The `examples/headless-runner` package shows how to call Rime from Node instead
of shelling out to `rime run`. Use this pattern for CI plugins, custom
dashboards, and local automation that wants structured run results.

Source:
[`examples/headless-runner`](https://github.com/danielsjoo/rime/tree/main/examples/headless-runner).

## What it Teaches

- Loading a `pipeline.dag.yaml` programmatically
- Validating a DAG before execution
- Passing source data directly as in-memory rows
- Reading ordered node IDs and audit data from the run result
- Building a lineage graph from the run audit

## Package

```json
{
  "name": "headless-runner",
  "private": true,
  "type": "module",
  "scripts": {
    "run": "node src/cli.js"
  },
  "dependencies": {
    "@rimekit/core": "file:../../packages/core",
    "@rimekit/lineage": "file:../../packages/lineage"
  }
}
```

## Runner

```js
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseRimeYaml, runDag, validateDagSpec } from '@rimekit/core'
import { buildSimplifiedLineageDag } from '@rimekit/lineage'

const fixturePath = join(
  process.cwd(),
  'packages',
  'core',
  'test',
  'fixtures',
  'simple-filter.dag.yaml'
)

const spec = validateDagSpec(parseRimeYaml(readFileSync(fixturePath, 'utf8')))

const run = await runDag(spec, {
  source_csv: [{ age: 14 }, { age: 18 }, { age: 29 }],
})

const lineage = buildSimplifiedLineageDag({
  spec,
  auditTrail: run.auditTrail,
  lineage: {
    annotations: [
      {
        id: 'adults_retained',
        transition: {
          sourceNodeId: 'source_csv',
          targetNodeId: 'adults',
          targetInputIndex: 0,
        },
        label: 'Adults retained',
      },
    ],
  },
})

console.log('ordered nodes:', run.orderedNodeIds.join(' -> '))
console.log('lineage nodes:', lineage.nodes.length)
```

## Run It

Run from the repo root so the fixture path resolves:

```bash
git clone https://github.com/danielsjoo/rime
cd rime
npm --prefix examples/headless-runner install
node examples/headless-runner/src/cli.js
```

The script prints the topological execution order and the number of lineage
nodes produced from the run audit.

## When to Use This Pattern

- You need a Node API instead of a subprocess.
- You want to feed test rows directly without writing a source CSV.
- You want structured run metadata for a dashboard or CI annotation.
- You want to build lineage views or custom reports from the audit trail.
