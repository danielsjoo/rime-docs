---
title: rime introspect
description: Generate a starter DAG node block from a script file.
---

```bash
rime introspect <script-path> [--emit json|yaml] [--node-id id] [--python-bin path] [--rscript-bin path]
```

`rime introspect` reads a script and emits the node manifest Rime can infer from
it. It is meant to shorten the path from "I wrote a script" to "this script is
wired into a DAG."

## What It Understands

| Script type | Introspection behavior |
|---|---|
| JavaScript | Imports the file and reads the default `defineNode({ in, out, run })` bundle. |
| Python | Parses the AST and looks for top-level `def run(...)` or `def transform(...)`. |
| R | Parses the script for `run <- function(...)` or `transform <- function(...)`. |
| SQL | Emits a `kind: sql` node pointing at the query. |

Python introspection does not execute the script. JavaScript introspection
imports the module, so keep side effects out of module top level.

## Examples

```bash
rime introspect scripts/features.py --emit yaml --node-id features
rime introspect scripts/enrich.mjs --emit json --node-id enriched
```

YAML output is a starter block you can paste into `pipeline.dag.yaml`, then edit
the `in:` bindings to point at real upstream nodes and params.

## Related Commands

- [`rime validate`](/rime-docs/cli/validate/) - confirm the pasted node block is valid.
- [Language node reference](/rime-docs/nodes/script/) - full field list.
