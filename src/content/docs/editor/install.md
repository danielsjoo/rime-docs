---
title: Editor Install
description: How to run and package Rime Editor during the beta.
---

Rime Editor is currently a source-built Electron app. Public downloads and
signed installers are not published yet.

## Current Dev Install

Clone `rime` and `rime-editor` next to each other:

```bash
mkdir rime-workspace
cd rime-workspace

git clone https://github.com/danielsjoo/rime
git clone https://github.com/danielsjoo/rime-editor

cd rime-editor
npm install
npm run dev
```

On `npm run dev`, the editor runs `scripts/prepare-rime-link.cjs`. That script
links the local `@rimekit/core`, `@rimekit/lineage`, and `@rimekit/runtime`
packages, rebuilds them, and links the Python/R sidecar runtimes used by the
desktop app.

If your checkouts are not siblings, set `RIME_REPO_ROOT`:

```bash
RIME_REPO_ROOT=/path/to/rime npm run dev
```

## Build App Bundles

The packaging commands also prepare the local Rime runtime before building:

```bash
npm run build:mac
npm run build:win
npm run build:linux
```

For an unsigned local macOS build:

```bash
npm run dist-no-sign
```

## Verifying

Open the app and load a folder that contains `pipeline.dag.yaml`. The first
useful smoke test is the checked-in DAG showcase:

```text
/path/to/rime/examples/dag-showcase
```

The editor should show the DAG canvas, node inspector, dataset preview, and
report preview without requiring Python or R sidecars because that example uses
core nodes for its runnable path.

## Planned Release Installs

The intended release path is packaged desktop downloads for macOS, Windows, and
Linux, with the compatible Rime runtime bundled. Auto-update behavior should
only be documented once signed public builds are available and tested.
