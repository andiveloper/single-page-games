# CLAUDE.md

Kleine Offline-Spiele, jedes in genau einer HTML-Datei, veröffentlicht über GitHub Pages.
Die Designsprache steht vollständig in [`DESIGN.md`](DESIGN.md). **Vor jedem neuen oder geänderten Spiel lesen.**
Hier stehen nur die Regeln, die nie verletzt werden dürfen.

## Grundregeln

- **Eine Datei, offline.** Ein Spiel = `<ordner>/index.html`. Kein CDN, keine Webfonts, keine externen Bilder oder Töne
  (Inline-SVG, `data:`-URLs, Web Audio). Die heruntergeladene Datei muss im Flugmodus laufen.
- **Zwei Kategorien.** U6 (`<body class="game u6">`): praktisch kein Text, nur Emoji, Ton, Vibration, kein Verlieren.
  Ü6 (`<body class="game ue6">`): kurze Wörter erlaubt, trotzdem sehr einfach.
- **Phone first.** Pixel 8a (412 × 915) im Hochformat, dann Tablet hoch und quer. Große Tasten, kein Überlauf.
- **Gemeinsames Design** kommt aus `design/spg.css` und `design/spg.js` und wird mit `node tools/design.mjs --write`
  in jede Datei eingesetzt. Design nur dort ändern, nie in den Blöcken einer einzelnen Spieldatei.

## Kopfleiste: in jedem Spiel gleich

Genau diese vier Knöpfe, in dieser Reihenfolge (Markup in `DESIGN.md`):
🏠 Startseite · 🔊 Ton · 🔄 Neues Spiel · ⛶ Vollbild

- **Ton ist standardmäßig aus** und gilt für alle Spiele gemeinsam. Jede Tonquelle beginnt mit `if (SPG.muted) return;`.
- **Kein ⚙️.** Einstellungen (Schwierigkeit, Tempo, Größe …) stehen im Startbildschirm, der beim Öffnen und nach 🔄 erscheint.
- 🔄 mitten im Spiel fragt nach. Spielknöpfe gehören in die `.gamebar` unter dem Spielfeld, nicht in die Kopfleiste.

## Neues Spiel

1. Ordner anlegen, Pflicht-Kopf aus `DESIGN.md` übernehmen, `node tools/design.mjs --write`.
2. Auf der Startseite `index.html` eine Karte in der richtigen Sektion (U6 / Ü6) mit ▶️ Spielen und ⬇️ Herunterladen ergänzen.
3. `node tools/design.mjs` muss grün sein (läuft auch in CI). Am Pixel-8a-Format und am Tablet anschauen.

## Arbeitsweise

- Texte, Commits und PRs auf Deutsch.
- Jede Änderung als PR; wenn die Prüfung grün ist, auf `main` mergen.
