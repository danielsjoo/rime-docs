# Rime Launch Style Guide

This is the high-level visual contract for Rime docs, the CLI docs surface, the Rime Editor app, and the Rime Editor product page. The goal is consistency, not sameness: the product page can be louder, the editor can stay dense and utilitarian, and the CLI docs can stay calm and readable.

## Brand Feel

Rime should feel like a focused technical product for people doing careful data work: precise, calm, modern, and a little bit crisp. Avoid generic SaaS gradients, cute frost imagery, and heavy enterprise dashboards.

## Typography

- Primary UI and docs font: system sans with Inter-style proportions.
- Display headlines: same sans family, heavier weight, no negative letter spacing.
- Code, paths, IDs, table schema, and commands: JetBrains Mono first when available, then system mono.
- Docs pages should optimize for reading. Product pages may use larger display sizes, but should keep the same font family and weight language.

## Color Tokens

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Ink | `--rime-ink` | `#0a0e13` | Primary text, dark sections |
| Body text | `--rime-text` | `#1a202c` | Docs/body copy |
| Muted text | `--rime-muted` | `#4a5568` | Secondary copy, metadata |
| Paper | `--rime-paper` | `#ffffff` | Main backgrounds |
| Subtle paper | `--rime-paper-subtle` | `#f8fafc` | Sidebars, panels, quiet bands |
| Line | `--rime-line` | `#e2e8f0` | Borders and dividers |
| Strong line | `--rime-line-strong` | `#cbd5e0` | Hover/active borders |
| Rime accent | `--rime-accent` | `#0891b2` | Primary actions, active nav, selected core nodes |
| Accent soft | `--rime-accent-soft` | `#cffafe` | Hover fills and low-emphasis accents |
| Success/code | `--rime-success` | `#16a34a` | Ready states, code/script nodes |
| Stats/warning | `--rime-warning` | `#d97706` | Statistical nodes, warnings, stale state |
| Danger | `--rime-danger` | `#dc2626` | Errors only |

## Application Rules

- Use cyan as the main Rime accent across docs, landing, and editor UI.
- Use emerald only for code/data-ready/success semantics.
- Use amber for statistics and warning/stale states.
- Use red only for errors.
- Keep page sections and app surfaces mostly white or near-white; use dark sections sparingly for product storytelling.
- Cards and framed tools should use 8px radius or less.
- Avoid logo marks in docs chrome for launch. Use the `Rime` typography as the brand anchor.

## Surface Notes

- CLI docs: quiet, readable, mostly white with cyan links/actions.
- Rime Editor product page: larger type and darker hero sections are allowed, but they must use the same token family.
- Rime Editor app: dense, utilitarian, and fast to scan. Prefer token-level consistency over decorative branding.
