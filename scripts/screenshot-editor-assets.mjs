/**
 * Generate clean Rime Editor product assets from isolated DOM components.
 *
 * Run from rime-docs:
 *   node scripts/screenshot-editor-assets.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public/editor/assets');

const shots = [
  ['hero', 'hero-dag-focus.jpg'],
  ['table', 'table-scan-focus.jpg'],
  ['report', 'report-dag-focus.jpg'],
  ['yaml', 'yaml-spec-focus.jpg'],
  ['example', 'example-table-focus.jpg'],
];

await mkdir(OUT, { recursive: true });

const html = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --ink: #0a0e13;
        --text: #1a202c;
        --muted: #4a5568;
        --muted-2: #718096;
        --paper: #ffffff;
        --paper-subtle: #f8fafc;
        --paper-code: #f1f5f9;
        --line: #e2e8f0;
        --line-strong: #cbd5e0;
        --accent: #0891b2;
        --accent-soft: #cffafe;
        --success: #16a34a;
        --warning: #d97706;
        --danger: #dc2626;
        --mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        min-width: 1800px;
        background: #eef2f7;
        color: var(--text);
      }

      body {
        display: grid;
        gap: 72px;
        padding: 64px;
      }

      .shot {
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--paper);
        box-shadow: 0 20px 60px rgb(15 23 42 / 14%);
      }

      .mono {
        font-family: var(--mono);
      }

      .muted {
        color: var(--muted);
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 58px;
        padding: 0 22px;
        background: var(--paper-subtle);
        border-bottom: 1px solid var(--line);
      }

      .brand {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        color: var(--ink);
        font-weight: 780;
      }

      .brand small {
        color: var(--muted);
        font-size: 14px;
        font-weight: 680;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        color: var(--muted);
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--paper);
        font-size: 13px;
        font-weight: 680;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--accent);
      }

      .dot.success {
        background: var(--success);
      }

      .dot.warning {
        background: var(--warning);
      }

      .hero-shot {
        width: 1600px;
        height: 1000px;
        background: var(--paper-subtle);
      }

      .hero-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 430px;
        gap: 18px;
        height: calc(100% - 58px);
        padding: 18px;
      }

      .canvas,
      .inspector,
      .panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper);
      }

      .canvas {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 1px 1px, #dbe3ea 1px, transparent 0) 0 0 / 20px 20px,
          #ffffff;
      }

      .hero-lines,
      .report-lines {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .node {
        position: absolute;
        width: 268px;
        min-height: 88px;
        padding: 14px 16px 12px;
        border: 2px solid var(--line-strong);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 10px 26px rgb(15 23 42 / 8%);
      }

      .node.selected {
        border-color: var(--accent);
      }

      .node.success {
        border-color: #86efac;
      }

      .node.warning {
        border-color: #fcd34d;
      }

      .node-title {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        color: var(--ink);
        font-size: 15px;
        font-weight: 760;
        line-height: 1.25;
      }

      .node-kind {
        color: var(--muted);
        font-size: 11px;
        font-weight: 820;
        text-transform: uppercase;
      }

      .node-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 18px;
        color: var(--muted);
        font-size: 13px;
      }

      .node-code {
        margin-top: 10px;
        padding: 7px 8px;
        color: #5b21b6;
        border-radius: 5px;
        background: #f5f3ff;
        font-size: 12px;
      }

      .node.n1 {
        left: 192px;
        top: 140px;
      }

      .node.n2 {
        left: 542px;
        top: 82px;
      }

      .node.n3 {
        left: 542px;
        top: 232px;
      }

      .node.n4 {
        left: 424px;
        top: 396px;
      }

      .node.n5 {
        left: 424px;
        top: 552px;
      }

      .node.n6 {
        left: 424px;
        top: 708px;
      }

      .inspector {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .inspector-header {
        padding: 22px;
        border-bottom: 1px solid var(--line);
      }

      .inspector-header h2,
      .report-header h1 {
        margin: 0;
        color: var(--ink);
        font-size: 28px;
        letter-spacing: 0;
        line-height: 1.1;
      }

      .inspector-header p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        padding: 18px;
      }

      .metric {
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper-subtle);
      }

      .metric span {
        display: block;
        color: var(--muted);
        font-size: 11px;
        font-weight: 760;
        text-transform: uppercase;
      }

      .metric strong {
        display: block;
        margin-top: 7px;
        color: var(--ink);
        font-size: 24px;
      }

      .mini-table {
        width: calc(100% - 36px);
        margin: 0 18px 18px;
        border-collapse: collapse;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        font-size: 14px;
      }

      .mini-table th,
      .mini-table td {
        padding: 13px 14px;
        border-bottom: 1px solid var(--line);
        text-align: left;
      }

      .mini-table th {
        color: var(--muted);
        background: var(--paper-subtle);
        font-size: 12px;
        font-weight: 780;
        text-transform: uppercase;
      }

      .mini-table tr:last-child td {
        border-bottom: 0;
      }

      .table-shot,
      .report-shot,
      .yaml-shot {
        width: 1280px;
        height: 900px;
      }

      .table-shot {
        background: var(--paper);
      }

      .table-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72px;
        padding: 0 28px;
        border-bottom: 1px solid var(--line);
      }

      .table-title h1 {
        margin: 0;
        color: var(--ink);
        font-size: 27px;
        line-height: 1.1;
      }

      .table-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        padding: 26px 28px 20px;
      }

      .table-summary .metric {
        padding: 20px;
        background: #ffffff;
      }

      .table-main {
        padding: 0 28px 28px;
      }

      .added {
        margin: 0 0 18px;
        color: #047857;
        font-size: 18px;
        font-weight: 760;
      }

      .tabs {
        display: flex;
        border-bottom: 1px solid var(--line);
      }

      .tab {
        padding: 14px 24px;
        border: 1px solid var(--line);
        border-bottom: 0;
        border-radius: 8px 8px 0 0;
        color: var(--muted);
        background: var(--paper-subtle);
        font-weight: 740;
      }

      .tab.active {
        color: var(--ink);
        background: #ffffff;
      }

      .data-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1.05fr;
        border: 1px solid var(--line);
        border-top: 0;
      }

      .col-head {
        min-height: 150px;
        padding: 20px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: var(--paper-subtle);
      }

      .col-head:last-child,
      .cell:nth-child(3n) {
        border-right: 0;
      }

      .col-head h3 {
        margin: 0 0 8px;
        color: var(--ink);
        font-size: 19px;
      }

      .badge {
        float: right;
        padding: 5px 8px;
        color: var(--muted);
        border-radius: 6px;
        background: var(--paper-code);
        font-size: 11px;
        font-weight: 820;
      }

      .profile {
        margin-top: 14px;
        height: 44px;
        background:
          linear-gradient(90deg, #3b82f6 0 17%, transparent 17% 18%, #3b82f6 18% 35%, transparent 35% 36%, #3b82f6 36% 53%, transparent 53% 54%, #3b82f6 54% 71%, transparent 71% 72%, #3b82f6 72% 89%, transparent 89% 90%, #3b82f6 90% 100%);
        border-radius: 6px;
      }

      .cell {
        padding: 16px 20px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        color: #27313f;
        font-size: 18px;
      }

      .report-shot {
        background: #ffffff;
      }

      .report-header {
        padding: 34px 38px 20px;
        border-bottom: 1px solid var(--line);
      }

      .report-header p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 17px;
      }

      .report-panel {
        position: relative;
        height: 706px;
        margin: 28px 38px 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--paper-subtle);
      }

      .report-node {
        position: absolute;
        width: 270px;
        padding: 16px;
        border: 2px solid var(--line-strong);
        border-radius: 8px;
        background: #ffffff;
      }

      .report-node h3 {
        margin: 0 0 12px;
        color: var(--ink);
        font-size: 16px;
        line-height: 1.2;
      }

      .report-node .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 12px;
        white-space: nowrap;
      }

      .report-node.selected {
        border-color: var(--accent);
      }

      .report-node.r1 {
        left: 260px;
        top: 72px;
      }

      .report-node.r2 {
        left: 640px;
        top: 72px;
      }

      .report-node.r3 {
        left: 640px;
        top: 236px;
      }

      .report-node.r4 {
        left: 460px;
        top: 390px;
      }

      .report-node.r5 {
        left: 460px;
        top: 544px;
      }

      .yaml-shot {
        display: grid;
        grid-template-rows: 64px minmax(0, 1fr);
        background: var(--paper);
      }

      .yaml-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 24px;
        background: var(--paper-subtle);
        border-bottom: 1px solid var(--line);
      }

      .yaml-button {
        padding: 9px 13px;
        color: var(--ink);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        background: #ffffff;
        font-size: 14px;
        font-weight: 720;
      }

      .yaml-button.disabled {
        color: var(--muted-2);
        background: var(--paper-code);
      }

      .editor-grid {
        display: grid;
        grid-template-columns: 54px minmax(0, 1fr);
        min-height: 0;
      }

      .line-numbers {
        padding: 24px 12px;
        color: #94a3b8;
        background: var(--paper-subtle);
        border-right: 1px solid var(--line);
        text-align: right;
        font: 18px/1.68 var(--mono);
      }

      pre {
        margin: 0;
        padding: 24px 28px;
        overflow: hidden;
        color: #1f2937;
        font: 18px/1.68 var(--mono);
        white-space: pre;
      }

      .example-shot {
        width: 1280px;
        height: 760px;
        padding: 30px;
        background: var(--paper-subtle);
      }

      .example-card {
        overflow: hidden;
        height: 100%;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #ffffff;
      }

      .example-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid var(--line);
      }

      .example-head h2 {
        margin: 0;
        color: var(--ink);
        font-size: 24px;
      }

      .example-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        border-bottom: 1px solid var(--line);
      }

      .example-grid div {
        padding: 15px 16px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        font-size: 15px;
      }

      .example-grid div:nth-child(5n) {
        border-right: 0;
      }

      .example-grid .h {
        color: var(--muted);
        background: var(--paper-subtle);
        font-size: 12px;
        font-weight: 820;
        text-transform: uppercase;
      }

      .sparkline {
        height: 210px;
        margin: 28px 24px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background:
          linear-gradient(180deg, transparent 0 24%, var(--line) 24% 24.5%, transparent 24.5% 49%, var(--line) 49% 49.5%, transparent 49.5% 74%, var(--line) 74% 74.5%, transparent 74.5%),
          linear-gradient(90deg, transparent 0 19%, var(--line) 19% 19.5%, transparent 19.5% 39%, var(--line) 39% 39.5%, transparent 39.5% 59%, var(--line) 59% 59.5%, transparent 59.5% 79%, var(--line) 79% 79.5%, transparent 79.5%);
      }

      .sparkline svg {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <section id="hero" class="shot hero-shot">
      <div class="topbar">
        <div class="brand">Rime <small>Editor</small></div>
        <div style="display:flex;gap:10px">
          <span class="pill"><span class="dot success"></span> dag-showcase</span>
          <span class="pill">pipeline.dag.yaml</span>
          <span class="pill"><span class="dot"></span> ready</span>
        </div>
      </div>
      <div class="hero-body">
        <div class="canvas">
          <svg class="hero-lines" viewBox="0 0 1098 888" fill="none">
            <path d="M326 228 C326 300 558 294 558 396" stroke="#94a3b8" stroke-width="3" />
            <path d="M676 170 L676 232" stroke="#94a3b8" stroke-width="3" />
            <path d="M676 320 C676 360 558 346 558 396" stroke="#94a3b8" stroke-width="3" />
            <path d="M558 484 L558 552" stroke="#94a3b8" stroke-width="3" />
            <path d="M558 640 L558 708" stroke="#94a3b8" stroke-width="3" />
          </svg>
          <article class="node n1">
            <div class="node-title"><span>Demographics (CSV)</span><span class="node-kind">source</span></div>
            <div class="node-meta mono"><span>(720, 11)</span><span>18ms</span></div>
          </article>
          <article class="node n2">
            <div class="node-title"><span>Longitudinal labs</span><span class="node-kind">source</span></div>
            <div class="node-meta mono"><span>(3,037, 10)</span><span>25ms</span></div>
          </article>
          <article class="node n3 success">
            <div class="node-title"><span>Per-patient lab rollups</span><span class="node-kind">aggregate</span></div>
            <div class="node-meta mono"><span>(681, 8)</span><span>47ms</span></div>
          </article>
          <article class="node n4 selected">
            <div class="node-title"><span>Patients x lab features</span><span class="node-kind">sql</span></div>
            <div class="node-meta mono"><span>(720, 18)</span><span>600ms</span></div>
          </article>
          <article class="node n5 warning">
            <div class="node-title"><span>Composite lab burden</span><span class="node-kind">derive</span></div>
            <div class="node-meta mono"><span>(720, 19)</span><span>9ms</span></div>
            <div class="node-code mono">coalesce([crp_mean], 0)</div>
          </article>
          <article class="node n6 selected">
            <div class="node-title"><span>Refined risk cohort</span><span class="node-kind">sql</span></div>
            <div class="node-meta mono"><span>(386, 20)</span><span>16ms</span></div>
          </article>
        </div>
        <aside class="inspector">
          <div class="inspector-header">
            <h2>Patients x lab features</h2>
            <p>SQL node with joined patient demographics and longitudinal lab aggregates.</p>
          </div>
          <div class="metrics">
            <div class="metric"><span>Rows</span><strong>720</strong></div>
            <div class="metric"><span>Columns</span><strong>18</strong></div>
            <div class="metric"><span>Null cells</span><strong>273</strong></div>
          </div>
          <table class="mini-table">
            <thead><tr><th>Column</th><th>Profile</th></tr></thead>
            <tbody>
              <tr><td>patient_id</td><td>720 distinct</td></tr>
              <tr><td>site</td><td>6 groups</td></tr>
              <tr><td>risk_tier</td><td>3 groups</td></tr>
              <tr><td>crp_mean</td><td>681 numeric</td></tr>
            </tbody>
          </table>
          <div style="padding: 0 18px 18px">
            <div class="panel" style="padding:18px;background:#f8fafc">
              <div class="mono" style="font-size:13px;color:#475569">source: queries/patient_lab_wide.sql</div>
              <div style="margin-top:12px;color:#0f172a;font-weight:730">Output ready for report</div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section id="table" class="shot table-shot">
      <div class="table-title">
        <h1>Patients x lab features (SQL)</h1>
        <span class="pill"><span class="dot success"></span> current output</span>
      </div>
      <div class="table-summary">
        <div class="metric"><span>Rows</span><strong>720</strong></div>
        <div class="metric"><span>Columns</span><strong>18</strong></div>
        <div class="metric"><span>Null cells</span><strong>273</strong></div>
      </div>
      <div class="table-main">
        <p class="added">(+7 lab aggregate columns)</p>
        <div class="tabs">
          <div class="tab active">Output</div>
          <div class="tab">Differences</div>
        </div>
        <div class="data-grid">
          <div class="col-head">
            <span class="badge">Categorical</span>
            <h3>patient_id</h3>
            <div class="muted">0 null · 720 distinct</div>
            <div class="profile"></div>
          </div>
          <div class="col-head">
            <span class="badge">Categorical</span>
            <h3>site</h3>
            <div class="muted">0 null · 6 distinct</div>
            <div style="margin-top:13px;line-height:1.55"><strong>North Ridge:</strong> 120<br /><strong>South Harbor:</strong> 120<br /><strong>West Valley:</strong> 120</div>
          </div>
          <div class="col-head">
            <span class="badge">Categorical</span>
            <h3>risk_tier</h3>
            <div class="muted">0 null · 3 distinct</div>
            <div style="margin-top:13px;line-height:1.55"><strong>stable:</strong> 378<br /><strong>guarded:</strong> 242<br /><strong>elevated:</strong> 100</div>
          </div>
          <div class="cell mono">PT-0001</div><div class="cell">North Ridge</div><div class="cell">stable</div>
          <div class="cell mono">PT-0002</div><div class="cell">Lakeview</div><div class="cell">elevated</div>
          <div class="cell mono">PT-0003</div><div class="cell">South Harbor</div><div class="cell">stable</div>
          <div class="cell mono">PT-0004</div><div class="cell">East Metro</div><div class="cell">guarded</div>
          <div class="cell mono">PT-0005</div><div class="cell">West Valley</div><div class="cell">stable</div>
          <div class="cell mono">PT-0006</div><div class="cell">Central</div><div class="cell">elevated</div>
        </div>
      </div>
    </section>

    <section id="report" class="shot report-shot">
      <div class="report-header">
        <h1>Rime Report</h1>
        <p>Generated from pipeline.dag.yaml</p>
      </div>
      <div class="report-panel">
        <svg class="report-lines" viewBox="0 0 1204 706" fill="none">
          <path d="M395 168 C395 236 775 210 775 236" stroke="#cbd5e0" stroke-width="3" />
          <path d="M775 168 L775 236" stroke="#cbd5e0" stroke-width="3" />
          <path d="M775 328 C775 376 595 356 595 390" stroke="#cbd5e0" stroke-width="3" />
          <path d="M595 482 L595 544" stroke="#cbd5e0" stroke-width="3" />
        </svg>
        <article class="report-node r1">
          <h3><span class="dot" style="display:inline-block;background:#94a3b8;margin-right:8px"></span>Demographics (CSV)</h3>
          <div class="row mono"><span>patients_source (720x11)</span><span>source</span></div>
        </article>
        <article class="report-node r2">
          <h3><span class="dot" style="display:inline-block;background:#94a3b8;margin-right:8px"></span>Longitudinal labs</h3>
          <div class="row mono"><span>labs_source (3,037x10)</span><span>source</span></div>
        </article>
        <article class="report-node r3 selected">
          <h3><span class="dot success" style="display:inline-block;margin-right:8px"></span>Per-patient lab rollups</h3>
          <div class="row mono"><span>lab_agg (681x8)</span><span>aggregate</span></div>
        </article>
        <article class="report-node r4 selected">
          <h3><span class="dot success" style="display:inline-block;margin-right:8px"></span>Patients x lab features</h3>
          <div class="row mono"><span>patient_lab_wide (720x18)</span><span>sql</span></div>
        </article>
        <article class="report-node r5">
          <h3><span class="dot warning" style="display:inline-block;margin-right:8px"></span>Composite lab burden</h3>
          <div class="row mono"><span>lab_load (720x19)</span><span>derive</span></div>
        </article>
      </div>
    </section>

    <section id="yaml" class="shot yaml-shot">
      <div class="yaml-toolbar">
        <span class="yaml-button">Upload Spec</span>
        <span class="yaml-button disabled">Apply Spec</span>
        <span class="pill" style="margin-left:auto">pipeline.dag.yaml</span>
      </div>
      <div class="editor-grid">
        <div class="line-numbers">1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10<br />11<br />12<br />13<br />14<br />15<br />16<br />17<br />18<br />19<br />20<br />21<br />22<br />23<br />24<br />25<br />26</div>
        <pre>specification_version: "2.1"
nodes:
  - id: patients_source
    kind: source
    path: data/patients.csv
    metadata:
      label: Demographics (CSV)
      group: ingest

  - id: lab_agg
    kind: aggregate
    inputs: [labs_source]
    groupBy:
      - "[patient_id]"
    metrics:
      - "[crp_mean] = [crp].mean()"
      - "[ldl_max] = [ldl].max()"
      - "[hba1c_mean] = [hba1c].mean()"
      - "[n_visits] = [crp].count()"

  - id: patient_lab_wide
    kind: sql
    in:
      patients_source: patients_source
      lab_agg: lab_agg
    source: queries/patient_lab_wide.sql</pre>
      </div>
    </section>

    <section id="example" class="shot example-shot">
      <div class="example-card">
        <div class="example-head">
          <h2>refined risk cohort sample</h2>
          <span class="pill"><span class="dot success"></span> 386 rows</span>
        </div>
        <div class="example-grid">
          <div class="h">patient_id</div><div class="h">site</div><div class="h">risk_tier</div><div class="h">crp_mean</div><div class="h">risk_index</div>
          <div class="mono">PT-0549</div><div>South Harbor</div><div>elevated</div><div class="mono">11.13</div><div class="mono">116.61</div>
          <div class="mono">PT-0256</div><div>East Metro</div><div>elevated</div><div class="mono">11.13</div><div class="mono">110.62</div>
          <div class="mono">PT-0627</div><div>South Harbor</div><div>elevated</div><div class="mono">11.14</div><div class="mono">109.32</div>
          <div class="mono">PT-0045</div><div>South Harbor</div><div>elevated</div><div class="mono">10.40</div><div class="mono">107.86</div>
          <div class="mono">PT-0599</div><div>West Valley</div><div>elevated</div><div class="mono">11.29</div><div class="mono">107.07</div>
        </div>
        <div class="sparkline">
          <svg viewBox="0 0 1180 210" fill="none">
            <path d="M35 156 C150 112 230 136 330 96 C442 52 520 92 612 72 C732 44 820 126 934 82 C1032 44 1102 66 1148 36" stroke="#0891b2" stroke-width="6" stroke-linecap="round" />
            <path d="M35 156 C150 112 230 136 330 96 C442 52 520 92 612 72 C732 44 820 126 934 82 C1032 44 1102 66 1148 36 L1148 210 L35 210 Z" fill="#cffafe" opacity="0.75" />
          </svg>
        </div>
      </div>
    </section>
  </body>
</html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 1 });
const page = await context.newPage();
await page.setViewportSize({ width: 1800, height: 1200 });
await page.setContent(html, { waitUntil: 'networkidle' });

for (const [id, filename] of shots) {
  const target = page.locator(`#${id}`);
  await target.screenshot({
    path: path.join(OUT, filename),
    type: 'jpeg',
    quality: 92,
  });
  console.log(`wrote public/editor/assets/${filename}`);
}

await browser.close();
