---
title: JavaScript language nodes
description: How JavaScript language nodes work in Rime, including defineNode, row inputs, async support, and outputs.
---

A JavaScript language node uses `kind: javascript`. Scripts export a
`defineNode(...)` bundle from `@rimekit/runtime`; Rime reads the manifest and
calls `run(...)` with named slot values.

## Minimum Example

```yaml
- id: enriched
  kind: javascript
  source: scripts/enrich.mjs
  in:
    cohort: features
    threshold: params.threshold
```

```js
// scripts/enrich.mjs
import { defineNode } from '@rimekit/runtime'

export default defineNode({
  in: { cohort: 'table', threshold: 'any' },
  out: { default: 'table' },
  run: async ({ cohort, threshold }) => {
    return cohort.rows.map((row) => ({
      ...row,
      flag: row.score > Number(threshold),
    }))
  },
})
```

The manifest's `in` keys should match the YAML `in:` slot keys. Bare default
functions are rejected in Rime 2.1.

## Function Signature

The runtime passes a single object to `run`.

| YAML `in:` slot | JavaScript value |
|---|---|
| Upstream node ref, for example `cohort: features` | `{ rows: Array<Record<string, unknown>> }` |
| Param ref, for example `threshold: params.threshold` | native JS scalar/array/object |

```js
run: ({ cohort, threshold }) => {
  for (const row of cohort.rows) {
    ...
  }
}
```

## Outputs

### Single Output

Return an array of plain row objects:

```js
export default defineNode({
  in: { orders: 'table' },
  out: { default: 'table' },
  run: ({ orders }) => orders.rows.filter((row) => row.total > 0),
})
```

### Multiple Outputs

Declare named outputs in the manifest and YAML, then return an object with
matching keys:

```yaml
- id: split
  kind: javascript
  source: scripts/split.mjs
  in: { cohort: features }
  out: { train: table, test: table }
```

```js
export default defineNode({
  in: { cohort: 'table' },
  out: { train: 'table', test: 'table' },
  run: ({ cohort }) => {
    const pivot = Math.floor(cohort.rows.length * 0.8)
    return {
      train: cohort.rows.slice(0, pivot),
      test: cohort.rows.slice(pivot),
    }
  },
})
```

Downstream refs are `split.train` and `split.test`.

### Non-Tabular Output

Use `any` for JSON-like values such as API responses or metadata:

```js
export default defineNode({
  in: { config: 'any' },
  out: { result: 'any' },
  run: async ({ config }) => {
    const response = await fetch(config.endpoint)
    return response.json()
  },
})
```

## Runtime Model

JavaScript nodes run in a Node child process per node. The subprocess imports
your script, verifies the `defineNode` bundle, calls `run(...)`, and sends the
result back to the runtime.

This keeps script execution separate from the main CLI/editor process while
still using the same Node version that launched Rime. JavaScript is a good fit
for API fetches, row-level reshaping, and logic that already belongs close to a
web/product codebase.

## Async Support

`run` can be `async`; the runtime awaits it.

```js
run: async ({ config }) => {
  const response = await fetch(config.endpoint)
  const data = await response.json()
  return data.rows.map((row) => ({ ts: row.timestamp, value: row.measurement }))
}
```

Avoid nondeterministic values such as `Date.now()` or `Math.random()` unless
they are passed in through `params`, because params become part of the cache
contract.

## Environment

Required: Node 22+, supplied by the same environment that runs the Rime CLI or
desktop app.

## See Also

- [Python language nodes](/scripts/python/) - pandas and matplotlib
- [R language nodes](/scripts/r/) - R functions and plot returns
- [SQL language nodes](/scripts/sql/) - DuckDB temp tables
- [Language node reference](/nodes/script/) - full field list
- [Polyglot runtime overview](/concepts/polyglot/) - cross-language design
