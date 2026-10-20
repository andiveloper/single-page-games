# Designsprache „Single-Page Games“

Alle Spiele sehen gleich aus und fühlen sich gleich an. Die Regeln hier gelten für jedes neue Spiel.

## Grundregeln

1. **Eine Datei, offline.** Jedes Spiel ist genau eine `index.html` in einem eigenen Ordner (`snake/index.html`).
   Kein CDN, keine Webfonts, keine Bilder oder Töne von außen. Bilder als Inline-SVG oder `data:`-URL,
   Töne mit Web Audio. Das Spiel muss im Flugmodus als heruntergeladene Datei laufen.
2. **Phone first.** Ziel ist das Pixel 8a (412 × 915 CSS-Pixel) im Hochformat, dann Tablet (hoch und quer).
   Nichts darf seitlich überlaufen, nichts unter der Kopfleiste verschwinden.
3. **Große Tasten.** Mindestens `var(--tap)` (56 px, Tablet 68 px). Große Knöpfe `var(--big)` (64 px, Tablet 72 px).
4. **Gemeinsames CSS.** Der Block aus [`design/spg.css`](design/spg.css) steht am Anfang jedes `<style>`:
   ```html
   <style>
   /* SPG-DESIGN:BEGIN */
   /* SPG-DESIGN:END */
     /* ab hier nur spielspezifisches CSS */
   </style>
   ```
   Genauso steht der Block aus [`design/spg.js`](design/spg.js) direkt nach `'use strict';` im `<script>`
   (`/* SPG-JS:BEGIN */ … /* SPG-JS:END */`, liefert den Ton-aus-Knopf).
   `node tools/design.mjs --write` füllt bzw. aktualisiert beide. `node tools/design.mjs` prüft alles (läuft auch in CI).
   Das Design wird nur in `design/spg.css` / `design/spg.js` geändert, danach `--write`.

## Zwei Kategorien

| | **U6** – bis 6 Jahre | **Ü6** – ab 6 & Erwachsene |
|---|---|---|
| `<body class>` | `game u6` | `game ue6` |
| Farbe | warm: Orange/Gelb | kühl: Indigo/Violett |
| Text | praktisch keiner: Emoji, Symbole, Ton, Vibration | kurze Wörter erlaubt (Punkte, „Neu“, Stufe), keine Absätze |
| Bedienung | tippen, ziehen; nichts kann „kaputtgehen“ | Wischen, langes Drücken, Tastatur am Tablet ok |
| Einstellungen | im Startbildschirm, Schritt für Schritt mit großen Knöpfen | im Startbildschirm, kurze Wörter erlaubt |
| Verlieren | gibt es nicht, nur Lob | ja, mit „Nochmal“-Knopf |

`body.game` macht die Seite zur festen Vollbildfläche (kein Scrollen, Zoomen, Markieren, Pull-to-Refresh).

## Bausteine (aus `spg.css`)

- **Kopfleiste** `header.topbar` enthält nur `h1` (Emoji + kurzer Titel bzw. Spielstand: Punkte, Leben, Rekord …)
  und `.actions`. Am schmalen Handy im Hochformat (unter 600 px Breite) stehen die Knöpfe oben in einer eigenen Reihe
  und das `h1` darunter in voller Breite, damit der Spielstand nie hinter den Knöpfen verschwindet.
  Quer und am Tablet ist alles eine Reihe. Den Spielstand deshalb nicht am Handy ausblenden.
  `.actions` ist in **jedem Spiel gleich**:
  ```html
  <div class="actions">
    <a class="icon-btn home-btn" href="../" aria-label="Alle Spiele">🏠</a>
    <button class="icon-btn mute-btn" id="btn-mute" aria-label="Ton aus" aria-pressed="true">🔇</button>
    <button class="icon-btn" id="btn-new" aria-label="Neues Spiel">🔄</button>
    <button class="icon-btn fs-btn" aria-label="Vollbild" aria-pressed="false">⛶</button>
  </div>
  ```
  🏠, 🔊 und ⛶ funktionieren allein durch `spg.js` (🏠 versteckt sich bei `file:`, ⛶ wo es kein Vollbild gibt).
  🔄 verdrahtet das Spiel selbst. **Kein ⚙️** (prüft `tools/design.mjs`).
  Einzige Ausnahme: ein Knopf, den man mitten im Spiel sofort braucht (⏸️ bei Snake), steht davor ganz links.
- **Spielknöpfe** (↩️ Zurück, 🚩 Flagge, 👁️ Vorlage …) stehen in `.gamebar` unter dem Spielfeld (große `.icon-btn`).
- **Startbildschirm** statt Einstellungen: `.overlay` mit großen Auswahlknöpfen, erscheint beim Öffnen und nach 🔄
  (vorher Rückfrage, wenn ein Spiel läuft). Mehrere Einstellungen nacheinander als Schritte mit ⬅️ zurück
  (z. B. Foto-Puzzle: 📷 Eigenes Foto / 🦕 Beispielfoto → Anzahl Teile; Seifenblasen: Spiel → Tempo).
  Die letzte Auswahl startet das Spiel. ✖️ schließt ihn und spielt weiter.
- **Knöpfe** `.icon-btn` (quadratisch, Emoji), `.icon-btn.active` (eingeschaltet),
  `.big-btn` (Hauptaktion, Farbverlauf der Kategorie), `.big-btn.success` (Ja / Weiter), `.big-btn.plain` (Nein / Abbrechen),
  `.big-btn.soft` (Nebenaktion). Mehrere nebeneinander in `.row`, untereinander in `.stack`.
- **Auswahl** `.choice-grid` mit `.choice-btn` / `.choice-btn.selected` (Anzahl, Schwierigkeit, Geschwindigkeit).
- **Dialoge** `.overlay > .dialog` mit `.big-emoji`, `h2`, kurzem `p`. Ja/Nein als `✔️`/`✖️` mit `aria-label`.
- **Sonstiges** `.card`, `.muted`, `.section-label`, `.toast`, `canvas.confetti`, `.visually-hidden`.
- **Tokens** `--primary`, `--primary-2`, `--primary-ink`, `--primary-soft`, `--primary-line`, `--success`, `--danger`,
  `--ink`, `--muted`, `--surface`, `--surface-2`, `--line`, `--radius`, `--radius-sm`, `--gap`, `--shadow`, `--font`.
  Spielspezifische Farben dürfen dazukommen, Abstände und Rundungen kommen aus den Tokens.

## Verhalten

- **Rückmeldung bei jeder Aktion:** kurzer Ton (Web Audio), bei Erfolg `navigator.vibrate(30)`, beim Gewinnen Konfetti + Dialog.
  Vorlage: `Sound`, `buzz` und `Confetti` in [`foto-puzzle/index.html`](foto-puzzle/index.html) kopieren.
- **Ton aus:** `Sound.tone()` (und jede andere Tonquelle) beginnt mit `if (SPG.muted) return;`.
  Ton ist **anfangs aus** und der Zustand gilt für alle Spiele gemeinsam (`localStorage` `spg-muted`). Auch Sprachausgabe hält sich daran.
- **Neustart mitten im Spiel** fragt nach (Dialog mit ✖️ / ✔️).
- **Kein Kontextmenü** bei langem Drücken (`contextmenu` → `preventDefault`), außer das Spiel braucht es nicht anders.
- **Drehen** des Geräts baut das Spielfeld neu auf, ohne Fortschritt zu verlieren.
- `prefers-reduced-motion` wird von `spg.css` berücksichtigt.
- Speichern (Highscore, Einstellungen) nur über `localStorage` in `try/catch`.

## Pflicht-Kopf jeder Spieldatei

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#fed7aa">  <!-- Ü6: #e0e7ff -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Snake 🐍</title>
  <style>
/* SPG-DESIGN:BEGIN */
/* SPG-DESIGN:END */
  </style>
</head>
<body class="game ue6">
```

## Neues Spiel hinzufügen

1. Ordner `<name>/index.html` anlegen (Kopf wie oben), `node tools/design.mjs --write`.
2. In der Startseite `index.html` eine `article.card.game-card` in der passenden Sektion (`.u6` oder `.ue6`) ergänzen,
   mit ▶️ Spielen und ⬇️ Herunterladen (`download="<name>.html"`). Den Platzhalter „Bald mehr“ entfernen, sobald die Sektion ein Spiel hat.
3. `node tools/design.mjs` muss grün sein. Am Pixel-8a-Format (412 × 915) und Tablet (820 × 1180, quer 1180 × 820) anschauen.
