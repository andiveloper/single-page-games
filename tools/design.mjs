#!/usr/bin/env node
// Prüft (Standard) oder aktualisiert (--write) alle Seiten:
//  - der Block zwischen SPG-DESIGN:BEGIN/END entspricht design/spg.css
//  - keine externen Ressourcen (Spiele müssen im Flugmodus laufen)
//  - Grundlagen für Handy: lang, viewport, Kategorie-Klasse u6/ue6
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const css = readFileSync(join(root, 'design/spg.css'), 'utf8').trim();
const BEGIN = '/* SPG-DESIGN:BEGIN */';
const END = '/* SPG-DESIGN:END */';
const block = `${BEGIN}\n${css}\n${END}`;

const pages = ['index.html'];
for (const d of readdirSync(root, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith('.') || ['design', 'tools', 'node_modules'].includes(d.name)) continue;
  if (existsSync(join(root, d.name, 'index.html'))) pages.push(`${d.name}/index.html`);
}

const errors = [];
for (const page of pages) {
  const file = join(root, page);
  let html = readFileSync(file, 'utf8');
  const fail = (msg) => errors.push(`${page}: ${msg}`);

  const a = html.indexOf(BEGIN), b = html.indexOf(END);
  if (a < 0 || b < a) {
    fail(`Design-Block fehlt (${BEGIN} ... ${END} im <style> einfügen)`);
  } else {
    const current = html.slice(a, b + END.length);
    if (current !== block) {
      if (write) { html = html.slice(0, a) + block + html.slice(b + END.length); writeFileSync(file, html); console.log(`aktualisiert: ${page}`); }
      else fail('Design-Block ist veraltet, `node tools/design.mjs --write` ausführen');
    }
  }

  // Externe Ressourcen: alles, was der Browser beim Öffnen nachladen würde
  const external = [
    /<(?:script|img|iframe|audio|video|source|embed)\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\//i,
    /<link\b[^>]*\bhref\s*=\s*["']?(?:https?:)?\/\//i,
    /url\(\s*["']?(?:https?:)?\/\//i,
    /@import\b/i,
    /\bfetch\s*\(\s*["'`](?:https?:)?\/\//i,
  ];
  for (const re of external) {
    const m = html.match(re);
    if (m) fail(`externe Ressource gefunden: ${m[0].slice(0, 80)}`);
  }

  if (!/<html\b[^>]*\blang=/i.test(html)) fail('<html lang="de"> fehlt');
  if (!/<meta\b[^>]*name=["']viewport["'][^>]*width=device-width/i.test(html)) fail('viewport-Meta-Tag fehlt');
  if (page !== 'index.html' && !/<body\b[^>]*class=["'][^"']*\b(?:u6|ue6)\b/i.test(html)) fail('<body class="u6 ..."> oder "ue6 ..." fehlt');
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.length} Seiten geprüft: ${pages.join(', ')}`);
