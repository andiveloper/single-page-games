# Single-Page Games

Kleine Spiele für Kinder und Erwachsene, jedes in genau einer HTML-Datei.

**▶️ Spielen: <https://andiveloper.github.io/single-page-games/>**

## Idee

- **Eine Datei, offline.** Jedes Spiel ist eine einzelne `index.html` in einem eigenen Ordner, ohne CDN, Webfonts oder externe Bilder.
  Auf der Übersichtsseite lässt sich jedes Spiel mit ⬇️ herunterladen und läuft danach auch im Flugmodus.
- **Phone first.** Gebaut für Handys im Hochformat, funktioniert auch auf Tablets.
- **Zwei Kategorien.** U6 (bis 6 Jahre, praktisch ohne Text) und Ü6 (ab 6 Jahren und Erwachsene).

## Mitmachen

Ein neues Spiel kommt in einen eigenen Ordner (`mein-spiel/index.html`) und wird in der [`index.html`](index.html) verlinkt.
Die gemeinsamen Design-Regeln stehen in [`DESIGN.md`](DESIGN.md).

```sh
node tools/design.mjs --write   # gemeinsames CSS aus design/spg.css einsetzen
node tools/design.mjs           # prüfen (läuft auch in CI)
```
