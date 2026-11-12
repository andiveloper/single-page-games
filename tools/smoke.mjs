#!/usr/bin/env node
// Rauchtest: öffnet jedes Spiel als Datei (wie heruntergeladen) am Pixel 8a und am Tablet,
// klickt sich durch den Startbildschirm, spielt kurz mit Ton an und schlägt fehl bei
//  - JavaScript-Fehlern (pageerror, console.error)
//  - seitlichem Überlauf
//  - 🔄 mitten im Spiel ohne Rückfrage
// Braucht Playwright mit Chromium: `npx playwright install chromium` (lokal oft schon vorhanden).
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = await import('playwright')); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const games = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.') && existsSync(join(root, d.name, 'index.html')))
  .map((d) => d.name)
  .filter((n) => !only.length || only.includes(n));

const viewports = [
  { name: 'Pixel 8a', width: 412, height: 915, isMobile: true, hasTouch: true },
  { name: 'Tablet quer', width: 1180, height: 820, isMobile: true, hasTouch: true },
];

const browser = await chromium.launch();
const errors = [];

async function closeOverlays(page) {
  // Klickt im sichtbaren Startbildschirm/Dialog den ersten Auswahl- oder Hauptknopf, bis keiner mehr offen ist.
  for (let i = 0; i < 8; i++) {
    const btn = await page.evaluateHandle(() => {
      const ov = [...document.querySelectorAll('.overlay')].find((o) => !o.hidden && getComputedStyle(o).display !== 'none');
      if (!ov) return null;
      const cands = [...ov.querySelectorAll('button, .choice-btn, label.big-btn')]
        .filter((b) => !b.hidden && !b.disabled && b.offsetParent !== null && !/✖️|⬅️/.test(b.textContent) && !b.querySelector('input[type=file]'));
      return cands[0] || null;
    });
    const el = btn.asElement();
    if (!el) return;
    await el.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
}

async function overlayOpen(page) {
  return page.evaluate(() => [...document.querySelectorAll('.overlay')].some((o) => !o.hidden && getComputedStyle(o).display !== 'none'));
}

for (const game of games) {
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const page = await ctx.newPage();
    const tag = `${game} @ ${vp.name}`;
    const fail = (m) => errors.push(`${tag}: ${m}`);
    page.on('pageerror', (e) => fail(`JS-Fehler: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') fail(`console.error: ${m.text()}`); });
    await page.goto(pathToFileURL(join(root, game, 'index.html')).href);
    await page.waitForTimeout(300);
    // Ton einschalten, damit auch der Web-Audio-Weg läuft
    await page.click('.mute-btn');
    await closeOverlays(page);
    // ein bisschen spielen: tippen auf Spielfeld, Tasten, Wischen
    const box = await page.evaluate(() => {
      const el = document.querySelector('main, .board, canvas:not(.confetti), #board') || document.body;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: Math.max(r.top, 0), w: r.width, h: r.height };
    });
    for (let i = 0; i < 12; i++) {
      const x = box.x + box.w * ((i * 37 % 10) + 0.5) / 10, y = box.y + box.h * ((i * 53 % 10) + 0.5) / 10;
      await page.mouse.click(x, y).catch(() => {});
      if (await overlayOpen(page)) await closeOverlays(page);
    }
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']) await page.keyboard.press(k);
    await page.waitForTimeout(600);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 1) fail(`seitlicher Überlauf um ${over}px`);
    // Drehen: Spielfeld neu aufbauen ohne Fehler
    await page.setViewportSize({ width: vp.height, height: vp.width });
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    // 🔄 öffnet immer ein Overlay (Rückfrage oder Startbildschirm), nie sofort ein neues Spiel ohne Dialog
    if (!(await overlayOpen(page))) {
      await page.click('#btn-new');
      await page.waitForTimeout(200);
      if (!(await overlayOpen(page))) fail('🔄 öffnet weder Rückfrage noch Startbildschirm');
    }
    await ctx.close();
  }
}
await browser.close();

if (errors.length) {
  console.error([...new Set(errors)].map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${games.length} Spiele × ${viewports.length} Formate ohne Fehler: ${games.join(', ')}`);
