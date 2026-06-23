---
title: Rime Editor Getting Started
description: Open a project, run the DAG, and learn the main editor surfaces.
---

Rime Editor is the desktop product surface for Rime pipelines. The CLI docs explain runtime concepts; this guide explains the app workflow.

## Open A Project

1. Start the app with `npm run dev`.
2. Choose a recent Rime project or open a project folder.
3. Confirm the DAG canvas renders and the status pill shows the latest run state.

## First Pass

- Use the canvas to orient around sources, transforms, scripts, statistics, and report nodes.
- Select a node to open the Node panel.
- Switch to Spec when you want to inspect or edit the YAML directly.
- Switch to Report when you want to preview the current run report.

## What To Check First

- Source nodes show expected row and column counts.
- SQL/script nodes show named input edges.
- The selected node panel shows table metrics and source code together.
- The report preview reflects the current spec and can open in a browser.

## Where CLI Docs Still Belong

Keep runtime flags, package installation, and CLI execution reference in the main Rime docs. Keep editor screenshots, app navigation, and product walkthroughs here.
