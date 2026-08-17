# Subject world icons

Drop these three image files in this folder to activate the custom
"Choose Your World" icons on the student home page. Until a file exists,
that card/badge falls back to a small placeholder (broken-image) — it
won't break the build.

| Filename              | Used for       | Suggested art              |
|------------------------|----------------|-----------------------------|
| `english-kingdom.png`  | English Kingdom | colorful castle             |
| `maths-galaxy.png`     | Maths Galaxy    | ringed planet                |
| `science-lab.png`      | Science Lab     | potted plant + flask         |

**Specs:** transparent background, square, at least 300x300px (PNG or
SVG). No colored badge sits behind them — the image itself carries the
color, matching the reference mockup.

Referenced from `client/src/data/subjectIcons.js`.
