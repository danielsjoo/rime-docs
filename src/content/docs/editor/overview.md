---
title: Rime Editor — Overview
description: The visual authoring tool for Rime pipelines.
---

:::caution
Rime Editor is in closed beta. Public download coming soon. The pages below are placeholders that will be filled in once the editor ships its first public release.
:::

Rime Editor is a desktop application (Electron, macOS / Windows / Linux) for authoring Rime pipelines visually. It pairs a node-graph canvas with code editors for SQL / Python / R / JavaScript script bodies and a live preview of intermediate node outputs.

## What it gives you

- **Visual DAG canvas** — drag nodes from a sidebar, wire them up, configure fields in a side panel
- **Built-in code editors** — Monaco-based editors for the four scripting languages, with Rime's expression DSL syntax highlighting on `filter` / `derive` / `aggregate` nodes
- **Live preview** — click any node to see its output table or stat result in the inspector
- **Run controls** — execute the full DAG, a subgraph, or a single node from the canvas
- **Validation** — schema + graph errors surface inline on the canvas, not in a terminal

## What it doesn't give you

- It's a **thin wrapper around the CLI engine**. The same `pipeline.dag.yaml` that the editor produces runs unchanged via `rime run` on a server or in CI. No editor-specific lock-in.
- No live collaborative editing. One author per file.
- No cloud-hosted variant — the editor runs locally and operates on a folder on disk.

## Status

- **Closed beta** — active development; expect changes
- **Open source** — Rime Editor's source will be made available once the public release lands
- **Free during beta** — pricing model TBD post-1.0

Until the public download is available, follow [the GitHub repo](https://github.com/rimekit/rime) for status updates.
