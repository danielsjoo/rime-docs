---
title: Embed in Node
description: Use @rimekit/runtime programmatically from any Node script. For CI plugins, custom dashboards, and headless execution.
---

> 🚧 **This page is a stub.** Real content is being ported from [`examples/headless-runner`](https://github.com/danielsjoo/rime/tree/main/examples/headless-runner) in the rime repo. See [EXAMPLES_PLAN.md](https://github.com/danielsjoo/rime-docs/blob/main/EXAMPLES_PLAN.md) for the porting plan.

## What this example will demonstrate

How to call Rime as a library from Node, instead of via the CLI:

- Loading a `pipeline.dag.yaml` programmatically
- Running the DAG and capturing per-node lifecycle events
- Reading outputs as in-memory dataframes (Parquet decode optional)
- Use cases: CI plugins, custom UIs, scheduled jobs that don't want to shell out

## Skeleton

```js
import { runDag, parseRimeYaml } from '@rimekit/runtime'

const spec = parseRimeYaml(await fs.readFile('pipeline.dag.yaml', 'utf8'))

const result = await runDag(spec, {
  onNodeStart:    (nodeId) => console.log('start', nodeId),
  onNodeComplete: (nodeId, output) => console.log('done', nodeId, output),
  onNodeError:    (nodeId, err) => console.error('failed', nodeId, err),
})

console.log('all done', Object.keys(result.outputs))
```

(Real signature will be filled in from the actual `@rimekit/runtime` exports once the package is finalized.)

## Run the working example

```bash
git clone https://github.com/danielsjoo/rime
cd rime/examples/headless-runner
npm install
node index.js
```
