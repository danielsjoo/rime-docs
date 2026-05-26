# Rime — Brand brief for Claude Design / Figma iteration

Copy the block below into Claude Design as the opening prompt, optionally with one of the existing concept files pasted in as a starting point. The agent already produced 4 wordmarks, 3 palettes, 2 heroes, and 2 landing mockups in `docs/src/assets/concepts/` — those are real starting material, not throwaway. Don't start from scratch in Claude Design; start from one of those.

---

## The prompt

> Generate a landing page for **Rime**, an open-source toolkit for authoring reproducible polyglot data narratives. Audience: data journalists, social scientists, and researchers who want to publish data-driven stories.
>
> **Vibe:**
> - Scientific but warm — calm, considered, not cold corporate.
> - Cold/winter motif (Rime = the frosted ice deposit on cold surfaces). Use sparingly. No literal snowflakes everywhere.
> - Modern technical docs aesthetic in the vein of [Zama tfhe-rs docs](https://docs.zama.org/tfhe-rs/), Vercel, Linear, or Resend — but lighter and more inviting.
> - Better-styled than Apptainer / ReadTheDocs (which feel dated).
>
> **Layout (modeled on Zama's structure, but feel free to depart):**
> 1. Hero: wordmark + one-sentence pitch + two CTAs (Get Started, View on GitHub).
> 2. Three "get started" cards: What is Rime? · Install · Quick start.
> 3. Three "build with Rime" cards: Concepts (DAGs/nodes) · CLI · Rime Editor.
> 4. Examples gallery preview (3–4 cards, one of which is the cars × CO₂ narrative).
> 5. Footer with links to docs, GitHub, community.
>
> **Color direction:**
> - Accent: deep frost blue (#2b7cb8) — buttons, links, code highlights.
> - Soft: pale frost (#d4e7f5) — hover backgrounds, subtle accents.
> - Dark: deep navy (#0a3d5f) — headings on white.
> - Background: either pure white OR warm cream (#fef9f3) — the cream reads less corporate.
>
> **Typography:**
> - Sans-serif heading (Inter Tight, Geist, or similar) for clarity, weight 700, tight letter-spacing.
> - Mono code blocks with high contrast (JetBrains Mono or similar).
> - Generous line-height (1.55+) for reading.
>
> **Code blocks matter.** Rime's audience writes SQL, Python, R, and JavaScript. The code block style on the landing should look great with all four. Show real snippets, not lorem ipsum.
>
> **Things to avoid:**
> - Generic SaaS gradients.
> - Stock photography.
> - Literal snowflakes / winter clichés.
> - Anything that feels like Airflow / Dagster (too enterprise / production-orchestrator).
>
> **What I'm bringing in as starting material:**
> - 4 wordmark concepts (see `docs/src/assets/concepts/wordmarks/`)
> - 2 hero illustrations (see `docs/src/assets/concepts/heroes/`)
> - 2 landing layout mockups (see `docs/src/assets/concepts/landings/`)
> - 3 palette CSS variants (see `docs/src/styles/concepts/`)
>
> Treat those as ~80% done. Iterate to lock in the final visual.
>
> After the first iteration, polish:
> - The code block treatment (this is where most docs sites fall down)
> - A subtle animated DAG visualization in the hero (only if it can be done tastefully)
> - The hover states for nav and cards
> - Dark mode variants

---

## After Claude Design — moving to Figma (optional)

If you want a Figma source of truth:

1. **Install the Claude → Figma plugin** inside Figma (Plugins → Browse → "Claude"). See [Figma's blog post](https://www.figma.com/blog/introducing-claude-code-to-figma/).
2. **Connect the MCP** in Claude Code — once linked, ask Claude to "translate the current Claude Design preview into a Figma frame using my design system." It'll place actual component instances + apply tokens.
3. **Export tokens** — install Tokens Studio in Figma, export the palette/type/spacing tokens, drop into `docs/src/styles/custom.css`.

This is *optional*. You can stay code-only forever — the Starlight site doesn't need Figma to ship. Figma helps if/when you onboard a designer or want to design components outside the docs site (the Rime Editor desktop app, marketing material).
