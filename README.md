# Esteban Lafargue — Portfolio

Static site (HTML, CSS, JS, no framework), served by GitHub Pages from `main` / root.

- `index.html` — home (direction A · Event Graph)
- `klappen/` — Kläppen case study
- `css/style.css` — tokens and components (nodes, pins, wires)
- `js/main.js` — scroll wiring, YouTube facade, hover clips

## French version (/fr/)

The English pages are the source. The French site is generated:

    python3 tools/build_fr.py

- Translations live in `tools/i18n/fr-*.json` (English HTML → French HTML, one entry per text block).
- Anything without a translation stays in English and is listed in `tools/i18n/missing.json`.
- Data files carry their own French: `fr` blocks in `data/projects.json` and in `data/abyss.json` devlog entries.
- Run the build before every push that changes a page.
