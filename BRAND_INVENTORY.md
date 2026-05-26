# Rime — Brand asset inventory

Every place a branded asset needs to land after the brand sprint. Use this as a checklist when locking in the final wordmark + palette + hero.

## In the public Rime repo (`~/Code/rime/`)

- [ ] **`docs/src/assets/logo.svg`** — chosen wordmark (replaces the Starlight default)
- [ ] **`docs/src/assets/favicon.svg`** — chosen mark, square crop (derive from monogram or minimal wordmark)
- [ ] **`docs/src/styles/custom.css`** — chosen palette tokens (current placeholder is palette-a)
- [ ] **`docs/astro.config.mjs`** — `logo` block (light/dark variants if applicable); update `title` if it changes
- [ ] **`docs/src/content/docs/index.mdx`** — hero copy + hero image reference (currently text-only)
- [ ] **`README.md`** — optional top-of-readme banner (replace plain text header with branded image)
- [ ] **`.github/social-preview.png`** — GitHub repo social card (1280×640 recommended). Used for OG image when the repo URL is shared.
- [ ] **`docs/src/assets/og-image.png`** — Open Graph image for shared docs links

## In the private editor repo (simple_manuscripts, branch `rename/vostok-to-rime`)

- [ ] **`rime-editor/electron-builder.yml`** — `productName`, `icon` path (mac/win/linux variants)
- [ ] **`rime-editor/build/icon.icns`** — macOS app icon (1024×1024 source → .icns)
- [ ] **`rime-editor/build/icon.ico`** — Windows app icon
- [ ] **`rime-editor/build/icon.png`** — Linux app icon (512×512)
- [ ] **`rime-editor/build/background.png`** — macOS DMG background image
- [ ] **`rime-editor/src/renderer/public/`** — splash screen, About dialog assets
- [ ] **`rime-editor/src/renderer/src/assets/`** — in-app branding (window title bar, sidebar header, empty-state illustrations)

## Cleanup after decision

Once a combo is locked:

```bash
# Public repo
cd ~/Code/rime
# (Optionally) delete the concept folders once you've copied the winners out
rm -rf docs/src/assets/concepts/
rm -rf docs/src/styles/concepts/
# (Or keep them — they're tiny and document the design exploration)

git add -A
git commit -m "brand: lock in final wordmark, palette, hero, and landing"
```

## Don't forget

- **npm package READMEs.** Each `packages/*/README.md` is its own surface on npmjs.com once published. They should at least have the wordmark + a one-line pitch.
- **GitHub topic image / banner** for the repo settings page (optional).
- **HN / Reddit launch images** if you're planning a launch post.

## Aspect-ratio cheatsheet

| Surface | Recommended size |
|---|---|
| App icon source | 1024×1024 |
| Favicon | 32×32 (PNG), plus 512×512 SVG fallback |
| GitHub social preview | 1280×640 |
| Open Graph (docs) | 1200×630 |
| Twitter card | 1200×675 (large) or 1200×628 (summary) |
| macOS DMG bg | 660×400 |
| Discord embed thumbnail | 80×80 |

That's the whole list. Once these are all done, Rime has a coherent visual identity end-to-end.
