#!/usr/bin/env node
// Prüft (Standard) oder aktualisiert (--write) alle Seiten:
//  - der Block zwischen SPG-DESIGN:BEGIN/END entspricht design/spg.css
//  - Spiele: der Block zwischen SPG-JS:BEGIN/END entspricht design/spg.js, einheitliche Kopfleiste
//  - keine externen Ressourcen (Spiele müssen im Flugmodus laufen)
//  - Pflicht-Kopf (lang, viewport, theme-color je Kategorie, *-capable), body.game.u6/ue6
//  - keine Kopien der gemeinsamen Bausteine (Confetti, buzz, $, localStorage direkt)
//  - Startseite: Karte je Spiel in der richtigen Sektion mit ⬇️ download="<name>.html"
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const write = process.argv.includes('--write');
const css = readFileSync(join(root, 'design/spg.css'), 'utf8').trim();
const BEGIN = '/* SPG-DESIGN:BEGIN */';
const END = '/* SPG-DESIGN:END */';
const block = `${BEGIN}\n${css}\n${END}`;
const js = readFileSync(join(root, 'design/spg.js'), 'utf8').trim();
const JS_BEGIN = '/* SPG-JS:BEGIN */';
const JS_END = '/* SPG-JS:END */';
const jsBlock = `${JS_BEGIN}\n${js}\n${JS_END}`;

const pages = ['index.html'];
for (const d of readdirSync(root, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name.startsWith('.') || ['design', 'tools', 'node_modules'].includes(d.name)) continue;
  if (existsSync(join(root, d.name, 'index.html'))) pages.push(`${d.name}/index.html`);
}

const errors = [];
const categories = {};
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

  // Spiele: gemeinsames JS (Ton-aus-Knopf) am Anfang des <script>
  if (page !== 'index.html') {
    const c = html.indexOf(JS_BEGIN), d = html.indexOf(JS_END);
    if (c < 0 || d < c) {
      fail(`JS-Block fehlt (${JS_BEGIN} ... ${JS_END} im <script> einfügen)`);
    } else if (html.slice(c, d + JS_END.length) !== jsBlock) {
      if (write) { html = html.slice(0, c) + jsBlock + html.slice(d + JS_END.length); writeFileSync(file, html); console.log(`aktualisiert (JS): ${page}`); }
      else fail('JS-Block ist veraltet, `node tools/design.mjs --write` ausführen');
    }
    // Einheitliche Kopfleiste: 🏠 🔊 🔄 ⛶ in dieser Reihenfolge, kein ⚙️
    const top = (html.match(/<header class="topbar">([\s\S]*?)<\/header>/) || [])[1] || '';
    const order = ['home-btn', 'mute-btn', 'id="btn-new"', 'fs-btn'].map((k) => top.indexOf(k));
    if (order.some((i) => i < 0) || order.some((i, k) => k && i < order[k - 1])) {
      fail('Kopfleiste braucht 🏠 .home-btn, 🔊 .mute-btn, 🔄 #btn-new, ⛶ .fs-btn in dieser Reihenfolge');
    }
    // Spielstand (Punkte, Leben …) steht im h1, sonst nichts außer .actions: nur so bekommt er am Handy eine eigene Reihe
    const rest = top.replace(/<h1\b[\s\S]*?<\/h1>/, '').replace(/<div class="actions">[\s\S]*?<\/div>/, '').trim();
    if (!/<h1\b/.test(top) || rest) fail('Kopfleiste darf nur h1 (Titel/Spielstand) und div.actions enthalten');
    if (/⚙/.test(html)) fail('⚙️-Einstellungen gibt es nicht mehr, Einstellungen gehören in den Startbildschirm hinter 🔄');
  }

  // Externe Ressourcen: alles, was der Browser beim Öffnen nachladen würde
  const external = [
    /<(?:script|img|iframe|audio|video|source|embed)\b[^>]*\bsrc\s*=\s*["']?(?:https?:)?\/\//i,
    /<link\b[^>]*\bhref\s*=\s*["']?(?:https?:)?\/\//i,
    /url\(\s*["']?(?:https?:)?\/\//i,
    /@import\b/i,
    /\bfetch\s*\(\s*["'`](?:https?:)?\/\//i,
    /\bnew\s+Audio\s*\(\s*["'`](?:https?:)?\/\//i,
    /\bsrcset\s*=\s*["'][^"']*(?:https?:)?\/\//i,
    /<object\b[^>]*\bdata\s*=\s*["']?(?:https?:)?\/\//i,
    /\bimport\s*\(\s*["'`](?:https?:)?\/\//i,
  ];
  for (const re of external) {
    const m = html.match(re);
    if (m) fail(`externe Ressource gefunden: ${m[0].slice(0, 80)}`);
  }

  if (!/<html\b[^>]*\blang=["']de["']/i.test(html)) fail('<html lang="de"> fehlt');
  if (!/<meta\b[^>]*name=["']viewport["'][^>]*width=device-width/i.test(html)) fail('viewport-Meta-Tag fehlt');
  if (page === 'index.html') continue;

  // Pflicht-Kopf und Kategorie (DESIGN.md „Pflicht-Kopf jeder Spieldatei“)
  const cat = (html.match(/<body\b[^>]*class=["']([^"']*)["']/i) || [])[1] || '';
  const kind = /(?:^|\s)u6(?:\s|$)/.test(cat) ? 'u6' : /(?:^|\s)ue6(?:\s|$)/.test(cat) ? 'ue6' : null;
  if (!kind || !/(?:^|\s)game(?:\s|$)/.test(cat)) { fail('<body class="game u6"> oder "game ue6" fehlt'); continue; }
  categories[page.split('/')[0]] = kind;
  const meta = (name) => (html.match(new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) || [])[1];
  const viewport = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  if (meta('viewport') !== viewport) fail(`viewport muss genau "${viewport}" sein`);
  const theme = kind === 'u6' ? '#fed7aa' : '#e0e7ff';
  if ((meta('theme-color') || '').toLowerCase() !== theme) fail(`theme-color muss für ${kind === 'u6' ? 'U6' : 'Ü6'} ${theme} sein`);
  for (const m of ['mobile-web-app-capable', 'apple-mobile-web-app-capable']) if (meta(m) !== 'yes') fail(`<meta name="${m}" content="yes"> fehlt`);

  // U6: Überschriften und Sätze in Dialogen nur für Screenreader (.visually-hidden), sichtbar sind Emoji
  if (kind === 'u6') {
    const b = html.indexOf('<body class'), markup = html.slice(b, html.indexOf('<script>', b));
    for (const m of markup.matchAll(/<(h2|p)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
      if (!/visually-hidden/.test(m[2]) && /[A-Za-zÄÖÜäöüß]{2,}/.test(m[3].replace(/<[^>]+>/g, ''))) {
        fail(`U6 zeigt Text: <${m[1]}>${m[3].trim().slice(0, 40)}</${m[1]}> (class="visually-hidden" setzen)`);
      }
    }
  }

  // Gemeinsame Bausteine aus spg.js nicht wieder kopieren (SPG.sound, SPG.buzz, SPG.confetti, SPG.store, $)
  const script = html.slice(html.indexOf(JS_END) + JS_END.length);
  const copies = [
    [/\bconst Confetti\s*=\s*\{/, 'eigenes Confetti, SPG.confetti nutzen'],
    [/\bfunction buzz\s*\(/, 'eigenes buzz(), SPG.buzz nutzen'],
    [/\bconst \$\s*=/, 'eigenes $(), das kommt aus spg.js'],
    [/\bnavigator\.vibrate\b/, 'navigator.vibrate direkt, SPG.buzz nutzen'],
    [/\blocalStorage\b/, 'localStorage direkt, SPG.store nutzen'],
  ];
  for (const [re, msg] of copies) if (re.test(script)) fail(msg);
  // Eigene Audio-Engine nur, wenn sie selbst stumm schaltet (tier-klavier)
  if (/new\s+\(?\s*(?:window\.)?(?:AudioContext|AC)\b/.test(script) && !/SPG\.muted/.test(script)) fail('eigene Audio-Engine ohne SPG.muted');
}

// Startseite: jedes Spiel hat eine Karte in der richtigen Sektion mit ▶️ Spielen und ⬇️ download="<name>.html"
{
  const home = readFileSync(join(root, 'index.html'), 'utf8');
  const sections = {};
  for (const m of home.matchAll(/<section class="(u6|ue6)">([\s\S]*?)<\/section>/g)) sections[m[1]] = m[2];
  for (const [game, kind] of Object.entries(categories)) {
    const sec = sections[kind] || '';
    const name = kind === 'u6' ? 'U6' : 'Ü6';
    if (!sec.includes(`href="${game}/"`)) errors.push(`index.html: Karte mit ▶️ Spielen für ${game} fehlt in der Sektion ${name}`);
    if (!sec.includes(`href="${game}/index.html" download="${game}.html"`)) errors.push(`index.html: ⬇️ für ${game} braucht href="${game}/index.html" download="${game}.html" (Sektion ${name})`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.length} Seiten geprüft: ${pages.join(', ')}`);
