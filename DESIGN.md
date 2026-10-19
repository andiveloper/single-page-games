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
   `node tools/design.mjs --write` füllt bzw. aktualisiert ihn. `node tools/design.mjs` prüft alles (läuft auch in CI).
   Das Design wird nur in `design/spg.css` geändert, danach `--write`.

## Zwei Kategorien

| | **U6** – bis 6 Jahre | **Ü6** – ab 6 & Erwachsene |
|---|---|---|
| `<body class>` | `game u6` | `game ue6` |
| Farbe | warm: Orange/Gelb | kühl: Indigo/Violett |
| Text | praktisch keiner: Emoji, Symbole, Ton, Vibration | kurze Wörter erlaubt (Punkte, „Neu“, Stufe), keine Absätze |
| Bedienung | tippen, ziehen; nichts kann „kaputtgehen“ | Wischen, langes Drücken, Tastatur am Tablet ok |
| Einstellungen | hinter ⚙️, gedacht für Eltern | ⚙️ oder direkt im Startdialog |
| Verlieren | gibt es nicht, nur Lob | ja, mit „Nochmal“-Knopf |

`body.game` macht die Seite zur festen Vollbildfläche (kein Scrollen, Zoomen, Markieren, Pull-to-Refresh).

## Bausteine (aus `spg.css`)

- **Kopfleiste** `header.topbar` mit `h1` (Emoji + kurzer Titel) und `.actions` voller `.icon-btn`.
  Typisch: 🔄 Neu, ⚙️ Einstellungen. Ü6 zusätzlich Punkte/Level im Titel.
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
- **Neustart mitten im Spiel** fragt nach (Dialog mit ✖️ / ✔️).
- **Kein Kontextmenü** bei langem Drücken (`contextmenu` → `preventDefault`), außer das Spiel braucht es nicht anders.
- **Drehen** des Geräts baut das Spielfeld neu auf, ohne Fortschritt zu verlieren.
- **🏠 Alle Spiele** (`href="../"`) gehört in den ⚙️-Dialog und wird bei `location.protocol === 'file:'` ausgeblendet.
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
