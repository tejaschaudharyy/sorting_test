# SortScope — Sorting Algorithm Visualizer

A dashboard that animates Bubble, Selection, Insertion, Merge and Quick Sort step by step, following the C++ code shown beside each animation.

## How to run
Open `index.html` in any modern browser (Chrome, Edge, Firefox). No installation or build step is needed.
An internet connection is needed for the charts (Chart.js) and fonts, which load from a CDN. Everything else works offline.

## Files
- `index.html` — page layout
- `styles.css` — all styling, including light and dark themes
- `script.js` — sorting algorithms, step recording, animations, tables and charts

## What each section shows
- **Controls**: choose one algorithm or compare all 5, set the number of elements (2–50), generate Random / Nearly sorted / Reverse sorted / Few unique arrays, or type your own (commas or spaces; negatives and decimals allowed).
- **Playback**: Start, Pause, Resume, Step back / forward, Reset, a slider to jump to any step, and a speed control. Keyboard: Space = play/pause, arrow keys = step.
- **Animation**: bars (or boxes in Split view for Merge and Quick Sort) with colour coding and pointer tags (i, j, min, key, mid, pivot, p).
- **C++ code**: the line currently running is highlighted.
- **Live statistics**: comparisons, swaps/writes, passes (merges / partitions), step, elapsed time, n and indices in focus.
- **Tables**: pass-by-pass results, full step log, results on the current array (winner highlighted), and time/space complexity.
- **Charts**: operations over time, all algorithms compared, theoretical O(n) / O(n log n) / O(n²) growth, and measured operations vs n.

## How it works
Each algorithm runs once up front and records every step (comparison, swap, pass end) with a snapshot of the array. Playback, step back, the step log and the pass table all read from this recording, so the counts always match the C++ code.

Reference video: https://youtu.be/HGk_ypEuS24
