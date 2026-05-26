/**
 * Screenshot all design concept artifacts via headless Chromium.
 * Produces PNGs into docs/src/assets/concepts/screenshots/.
 *
 * Run as: node scripts/screenshot-concepts.mjs
 * (assumes cwd = docs/)
 */
import { chromium } from 'playwright';
import { readdir, mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONCEPTS = path.join(ROOT, 'src/assets/concepts');
const OUT = path.join(CONCEPTS, 'screenshots');

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
const page = await ctx.newPage();

const log = (msg) => console.log(`  ${msg}`);

/** Render an SVG inside a minimal HTML host so screenshot works reliably. */
async function shootSVG(svgPath, viewportW, viewportH, outName, padding = 0) {
  const absSvg = path.resolve(svgPath);
  const host = `
<!doctype html><html><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#ffffff;}
  body{width:${viewportW}px;height:${viewportH}px;display:flex;align-items:center;justify-content:center;padding:${padding}px;box-sizing:border-box;}
  img{display:block;width:100%;height:100%;object-fit:contain;}
</style></head>
<body><img src="${pathToFileURL(absSvg).href}"/></body></html>`;
  const tmpHtml = path.join(OUT, `__tmp-${path.basename(svgPath)}.html`);
  await writeFile(tmpHtml, host);
  await page.setViewportSize({ width: viewportW, height: viewportH });
  await page.goto(pathToFileURL(tmpHtml).href);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT, outName), fullPage: false });
  await unlink(tmpHtml);
  log(`📸 ${outName}`);
}

// ---- wordmarks: 4 SVGs (240x80 native, host viewport 480x160 for nicer breathing room) ----
for (const f of (await readdir(path.join(CONCEPTS, 'wordmarks'))).sort()) {
  if (!f.endsWith('.svg')) continue;
  await shootSVG(
    path.join(CONCEPTS, 'wordmarks', f),
    480, 160,
    f.replace('.svg', '.png'),
    32
  );
}

// ---- heroes: 2 SVGs at 1600x900 native, host viewport matches ----
for (const f of (await readdir(path.join(CONCEPTS, 'heroes'))).sort()) {
  if (!f.endsWith('.svg')) continue;
  await shootSVG(
    path.join(CONCEPTS, 'heroes', f),
    1600, 900,
    f.replace('.svg', '.png'),
    0
  );
}

// ---- landings: 2 HTML pages, full-page screenshot at 1440 wide ----
for (const f of (await readdir(path.join(CONCEPTS, 'landings'))).sort()) {
  if (!f.endsWith('.html')) continue;
  const url = pathToFileURL(path.join(CONCEPTS, 'landings', f)).href;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(OUT, f.replace('.html', '.png')),
    fullPage: true,
  });
  log(`📸 ${f}`);
}

await browser.close();
const files = (await readdir(OUT)).filter(f => f.endsWith('.png'));
console.log(`✅ wrote ${files.length} screenshots to ${OUT}`);
