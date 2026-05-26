---
title: JavaScript script nodes
description: How JavaScript script nodes work in Rime — defineNode helper, Arrow tables or row arrays in, dataframes out, runs in-process in Node 22+.
---

A JavaScript script node is a `script` node with `language: javascript`. You write a function via the `defineNode(...)` helper exported from `@rimekit/runtime`; the runtime invokes it with named arguments and captures the return value.

JavaScript nodes run **in-process** with the runtime — no subprocess spawn. This makes them the cheapest of the four languages.

## Minimum example

```yaml
- id: enriched
  kind: script
  language: javascript
  source: scripts/enrich.mjs
  in:
    cohort: features
    threshold: params.threshold
```

```js
// scripts/enrich.mjs
import { defineNode } from '@rimekit/runtime'

export default defineNode({
  in:  { cohort: 'table', threshold: 'any' },
  out: { default: 'table' },
  run: async ({ cohort, threshold }) => {
    return cohort.rows.map((r) => ({
      ...r,
      flag: r.score > Number(threshold),
    }))
  },
})
```

The `defineNode(...)` call wires your function into the runtime's named-slot protocol. Argument names in the destructured object must match the YAML's `in:` keys.

## Function signature

The runtime passes a single argument: a destructurable object containing your slot values.

| YAML `in:` slot | Native JS shape |
|---|---|
| Upstream node ID (e.g. `cohort: features`) | **`{ schema, rows }`** — `rows` is an array of plain objects; `schema` is the Arrow schema |
| `params.<name>` | Native JS scalar (`number`, `string`, `boolean`, `Array`, plain object) |

`cohort.rows` is the most ergonomic way to consume the data. If you need columnar access or zero-copy access to the Arrow buffer, you can also import the Arrow JS library and work with `cohort.table` (the underlying `arrow.Table`).

## Outputs

### Single output (default)

Return an array of plain objects (row-oriented) or an Arrow `Table` (columnar). The runtime accepts both and serializes to Parquet for the next node.

```js
export default defineNode({
  in:  { orders: 'table' },
  out: { default: 'table' },
  run: ({ orders }) => orders.rows.filter((r) => r.total > 0),
})
```

### Multiple named outputs

Return an object whose keys are output names. Each value can be a row array or an Arrow Table:

```js
export default defineNode({
  in:  { cohort: 'table' },
  out: { train: 'table', test: 'table' },
  run: ({ cohort }) => {
    const all = cohort.rows
    const n   = Math.floor(all.length * 0.8)
    return {
      train: all.slice(0, n),
      test:  all.slice(n),
    }
  },
})
```

YAML must declare matching outputs:

```yaml
- id: split
  kind: script
  language: javascript
  source: scripts/split.mjs
  in:  { cohort: features }
  out: { train: table, test: table }
```

Downstream references: `split.train`, `split.test`.

### Non-tabular outputs

For scalars or structured JSON (e.g. an API response, a computed value), declare `out: { result: 'any' }` and return whatever you want — it gets JSON-serialized.

```js
export default defineNode({
  in:  { config: 'any' },
  out: { result: 'any' },
  run: async ({ config }) => {
    const resp = await fetch(config.endpoint)
    return await resp.json()
  },
})
```

This is the canonical pattern for external API fetches (e.g. the `JS fetch CO₂` node in the cars-emissions example).

## What happens under the hood

JavaScript is the special case among the four languages — it runs **in-process** with the Node runtime that's already executing Rime:

1. **Inputs stay as Arrow buffers in memory.** No subprocess spawn, no serialization across processes. The Arrow Table is passed directly to your `run(...)` function.
2. **Row materialization is on-demand.** `cohort.rows` is a lazy getter — the first access materializes the row array from the Arrow columns. For 1k-row tables this is ~microseconds; for million-row tables, you might want to use `cohort.table` and iterate columnwise instead.
3. **`cohort.table` is the raw Arrow JS `Table` object.** Use this for zero-copy columnar access:
   ```js
   const ages = cohort.table.getChild('age').toArray()  // typed array, no allocation
   ```
4. **Your function runs.** Errors propagate to the runtime's audit trail with full stack traces.
5. **Outputs are converted back to Arrow** and written to Parquet for downstream nodes.

Because JavaScript runs in-process, **error stack traces are first-class** — you get full line numbers and source-mapped locations in the run audit. This is the language with the tightest developer feedback loop.

## Async support

`run` can be `async`. The runtime awaits it. Use this for external API calls, file I/O outside the DAG, or any IO-bound work:

```js
run: async ({ config }) => {
  const resp = await fetch(config.endpoint)
  const data = await resp.json()
  return data.rows.map((r) => ({ ts: r.timestamp, value: r.measurement }))
}
```

## Environment

Required: Node 22+ (the same runtime that powers the Rime CLI; nothing extra to install).

JavaScript script nodes are the recommended default for:
- External API fetches
- Lightweight reshaping (row maps, filters, column derives) where SQL would be overkill
- Anything you'd otherwise write a one-off Python script for, but want zero cold-start cost

## See also

- [Python script nodes](/scripts/python/) — same protocol, pandas DataFrame native
- [R script nodes](/scripts/r/) — same protocol, tibble native
- [SQL script nodes](/scripts/sql/) — runs against DuckDB
- [`script` node reference](/nodes/script/) — full field list
- [Polyglot runtime overview](/concepts/polyglot/) — the cross-cutting design
