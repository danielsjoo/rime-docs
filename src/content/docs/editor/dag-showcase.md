---
title: "Example: Dag Showcase"
description: The editor launch sample used for screenshot and walkthrough validation.
---

`dag-showcase` is the editor launch sample used for screenshot and walkthrough validation.

## What It Demonstrates

- CSV and Parquet sources
- aggregate nodes
- named-input SQL nodes
- derived feature nodes
- statistics nodes
- table scanning
- generated report preview

## Walkthrough

1. Open the `dag-showcase` project.
2. Run the DAG.
3. Select `patient_lab_wide`.
4. Confirm the table preview shows `(6, 8)` and the SQL source beneath it.
5. Open Report.
6. Confirm the report DAG shows output sizes in tuple notation.

## Why This Example Matters

It is small enough to scan quickly, but it touches the workflows that make the editor feel like a product instead of a YAML viewer.
