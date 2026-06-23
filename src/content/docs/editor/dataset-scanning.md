---
title: Dataset Scanning In Rime Editor
description: Use table metrics, column profiles, row samples, and diffs while selecting nodes.
---

Dataset scanning is the quickest way to understand whether a node did what you expected.

## Node Scan Surface

When a table-producing node is selected, the Node panel should lead with:

- row count
- column count
- null cell count
- high-cardinality column count
- compact column profiles
- sampled rows
- source code or node configuration below the preview

## SQL And Script Nodes

SQL and script-like nodes use named inputs. The canvas should show those inputs as real edges, and the table preview should resolve the selected node output from the current run.

## Review Questions

- Did the row count change in the expected direction?
- Did a transform add or remove columns intentionally?
- Are nulls concentrated in a new or important field?
- Do high-cardinality columns look like ids, labels, or accidental raw text?

## Good Follow-Up Work

- Add column-level search and pinning.
- Add profile deltas between selected node inputs and output.
- Add richer previews for object/stat outputs.
