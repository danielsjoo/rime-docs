---
title: Reports In Rime Editor
description: Preview the current report, inspect output sizes, and open the artifact in a browser.
---

The Report tab is the app-facing preview of the current generated report.

## Current Report

The editor keeps the Report tab simple:

- one current report for the active spec
- automatic rendering after a run
- an in-app preview
- a `View in browser` action for the generated HTML artifact

## DAG Overview

Report DAG nodes show:

- label and node id
- node kind
- run status color
- output size tuples like `(6, 8)`
- multiple visible outputs as `(...), (...)`

Edges are arrowless curves. The layout should move nodes into clearer parent/child positions before drawing edges.

## What Belongs In Report Docs

Keep this page focused on the editor report experience. Report schema details, CLI generation commands, and runtime output formats should stay in the main Rime docs.
