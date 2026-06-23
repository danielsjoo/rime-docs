import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'

const ROOT = process.cwd()
const DOCS_DIR = join(ROOT, 'src', 'content', 'docs')
const PAGES_DIR = join(ROOT, 'src', 'pages')
const PUBLIC_DIR = join(ROOT, 'public')
const BASE = '/rime-docs'

const TEXT_EXTENSIONS = new Set(['.md', '.mdx', '.astro'])

const forbidden = [
  {
    label: 'old GitHub org link',
    pattern: /github\.com\/rimekit\/rime/
  },
  {
    label: 'legacy Auto-report label',
    pattern: /\bAuto-report\b/
  },
  {
    label: 'nonexistent Python display helper',
    pattern: /rime_runner\.display_figure/
  },
  {
    label: 'nonexistent R registration/display API',
    pattern: /rime::(?:register|display_figure)/
  },
  {
    label: 'stale JavaScript in-process claim',
    pattern: /JavaScript[^.\n]*(?:in-process|no subprocess)|in-process execution model/
  },
  {
    label: 'stale fresh subprocess claim',
    pattern: /fresh (?:Python|Rscript|R) subprocess|subprocess per node/
  },
  {
    label: 'obsolete splitRatio field',
    pattern: /\bsplitRatio\b/
  },
  {
    label: 'old CLI help/version verification',
    pattern: /rime --(?:help|version)/
  }
]

function walk(dir, predicate = () => true) {
  const out = []
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry)
    const stat = statSync(abs)
    if (stat.isDirectory()) {
      out.push(...walk(abs, predicate))
    } else if (predicate(abs)) {
      out.push(abs)
    }
  }
  return out
}

function lineForOffset(text, offset) {
  return text.slice(0, offset).split('\n').length
}

function routeForDoc(abs) {
  const rel = relative(DOCS_DIR, abs).replaceAll('\\', '/')
  const withoutExt = rel.replace(/\.(md|mdx)$/, '')
  if (withoutExt === 'index') return `${BASE}/`
  if (withoutExt.endsWith('/index')) return `${BASE}/${withoutExt.slice(0, -'/index'.length)}/`
  return `${BASE}/${withoutExt}/`
}

function collectRoutes(docFiles) {
  const routes = new Set(docFiles.map(routeForDoc))
  routes.add(`${BASE}/editor/`)
  return routes
}

function collectPublicAssets() {
  return new Set(
    walk(PUBLIC_DIR).map((abs) => `${BASE}/${relative(PUBLIC_DIR, abs).replaceAll('\\', '/')}`)
  )
}

function stripHashAndQuery(href) {
  return href.split('#')[0].split('?')[0]
}

function isExternal(href) {
  return /^(https?:|mailto:|tel:|app:|data:)/.test(href)
}

function isAnchorOnly(href) {
  return href === '' || href.startsWith('#')
}

function checkAbsoluteLocalLink(href, routes, assets) {
  const clean = stripHashAndQuery(href)
  if (!clean.startsWith(`${BASE}/`)) return null
  if (routes.has(clean)) return null
  if (routes.has(clean.endsWith('/') ? clean : `${clean}/`)) return null
  if (assets.has(clean)) return null
  return `Broken local link: ${href}`
}

function routeForPage(abs) {
  const rel = relative(PAGES_DIR, abs).replaceAll('\\', '/')
  const withoutExt = rel.replace(/\.(astro|md|mdx)$/, '')
  if (withoutExt === 'index') return `${BASE}/`
  if (withoutExt.endsWith('/index')) return `${BASE}/${withoutExt.slice(0, -'/index'.length)}/`
  return `${BASE}/${withoutExt}/`
}

function routeForFile(abs) {
  if (abs.startsWith(DOCS_DIR)) return routeForDoc(abs)
  if (abs.startsWith(PAGES_DIR)) return routeForPage(abs)
  return `${BASE}/`
}

function checkRelativeAsset(abs, href, routes) {
  const clean = stripHashAndQuery(href)
  if (isExternal(clean) || isAnchorOnly(clean) || clean.startsWith('/')) return null
  if (!extname(clean) || clean.endsWith('/')) {
    const baseRoute = routeForFile(abs)
    const resolvedPath = new URL(clean, `https://rime.local${baseRoute}`).pathname
    if (routes.has(resolvedPath)) return null
    if (routes.has(resolvedPath.endsWith('/') ? resolvedPath : `${resolvedPath}/`)) return null
  }
  const target = resolve(dirname(abs), clean)
  if (existsSync(target)) return null
  return `Missing relative asset/link target: ${href}`
}

function findMarkdownTargets(text) {
  const targets = []
  const markdownLink = /!?\[[^\]]*]\(([^)]+)\)/g
  for (const match of text.matchAll(markdownLink)) {
    const href = match[1]?.trim()
    if (!href) continue
    targets.push({ href, offset: match.index ?? 0 })
  }

  const htmlHref = /\b(?:href|src)=["']([^"']+)["']/g
  for (const match of text.matchAll(htmlHref)) {
    const href = match[1]?.trim()
    if (!href) continue
    targets.push({ href, offset: match.index ?? 0 })
  }
  return targets
}

function main() {
  const docFiles = walk(DOCS_DIR, (abs) => ['.md', '.mdx'].includes(extname(abs)))
  const textFiles = [
    ...docFiles,
    ...walk(PAGES_DIR, (abs) => TEXT_EXTENSIONS.has(extname(abs))),
    join(ROOT, 'astro.config.mjs')
  ].filter((abs) => existsSync(abs))

  const routes = collectRoutes(docFiles)
  const assets = collectPublicAssets()
  const problems = []

  for (const file of textFiles) {
    const text = readFileSync(file, 'utf8')
    const rel = relative(ROOT, file)

    for (const rule of forbidden) {
      for (const match of text.matchAll(new RegExp(rule.pattern, rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`))) {
        problems.push(`${rel}:${lineForOffset(text, match.index ?? 0)} ${rule.label}`)
      }
    }

    for (const target of findMarkdownTargets(text)) {
      if (isExternal(target.href) || isAnchorOnly(target.href)) continue
      const absoluteProblem = checkAbsoluteLocalLink(target.href, routes, assets)
      if (absoluteProblem) {
        problems.push(`${rel}:${lineForOffset(text, target.offset)} ${absoluteProblem}`)
        continue
      }
      const relativeProblem = checkRelativeAsset(file, target.href, routes)
      if (relativeProblem) {
        problems.push(`${rel}:${lineForOffset(text, target.offset)} ${relativeProblem}`)
      }
    }
  }

  if (problems.length > 0) {
    console.error(`Docs quality check failed with ${problems.length} problem(s):`)
    for (const problem of problems) console.error(`- ${problem}`)
    process.exit(1)
  }

  console.log(`Docs quality check passed (${textFiles.length} files, ${routes.size} routes).`)
}

main()
