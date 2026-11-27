# Performance measurements

All numbers below were measured, not estimated. Setup: Apple-silicon laptop, headless Chrome driven by a script, production build. The main file is the generated `import-data.csv` (200,000 rows, 15.5 MB); a 500,000-row file from the same generator was used for the scale checks.

Two terms used throughout:

- **Long task**: a single block of work on the main thread longer than 50 ms. While it runs, the page cannot respond to anything. Zero long tasks means the page never froze.
- **Interactive**: the moment all rows are loaded and the grid can be used.

## 1. The app, stage by stage

| Action (200,000 rows) | Result |
|---|---|
| Load: parse in the worker, validate every cell, check duplicates | 0.2 s from first rows to done; 0 long tasks |
| First rows visible after picking the file | about 0.1 s |
| Scroll through all rows (60 jumps + 120 wheel steps) | 32 to 33 row elements in the DOM at any time; each jump drawn within one frame; 0 long tasks |
| Search: type a 6-letter word | one scan per typing pause; results about 20 ms after the pause; 0 long tasks |
| Clear the search | about 1 ms, no scan |
| Sort by a text column (dictionary order) | about 70 ms |
| Sort by spend (numeric where possible) | one 97 ms task |
| Filter to one problem type (67,366 rows) | 15 ms |
| Save one edit to a name, date, country, plan or spend | under 5 ms |
| Save one edit to an email or customer ID | about 70 ms (the duplicate re-check runs only for these two columns) |
| Country bulk fix: split recognised / unrecognised | 15 ms first time, then remembered until data changes |
| Country bulk fix: build the grouped plan | 7 ms (25 groups) |
| Country bulk fix: apply 67,366 cells | one 57 ms task; success state visible after about 0.37 s |
| Undo that bulk fix | about 80 ms |
| Revert all changes (67,367 cells) | one 58 ms task |

Pieces of the load, measured separately in Node: per-cell validation of all 200,000 rows 46 ms (runs in the worker, spread across chunks); the duplicate pass 54 ms (moved into the worker after this measurement, see below); recount of all problems 12 ms.

## 2. Why the architecture is what it is: parse × render benchmark

Before building the grid we measured every combination of three parsing strategies and two rendering strategies on the same files, with the CPU at normal speed and slowed 4× and 6× to stand in for weaker laptops. The test page was plain HTML and JavaScript with no React, so the "render everything" numbers are a best case for that approach.

**Parsing strategies**

- *main*: PapaParse on the main thread, whole file in one call.
- *worker, whole*: PapaParse in a Web Worker, all rows sent back in one message.
- *worker, chunked*: PapaParse in a Web Worker, 1 MB chunks, one message per chunk. This is what the app does.

**Rendering strategies**

- *full DOM*: every row becomes elements on the page.
- *virtual*: only the rows in view exist on the page (about 30), swapped as the user scrolls. This is what the app does.

### Time until interactive

| 200,000 rows | normal CPU | 4× slower | 6× slower |
|---|---|---|---|
| main + full DOM | 5.2 s | 23.2 s | 35.4 s |
| worker whole + full DOM | 7.4 s | 23.5 s | 35.9 s |
| worker chunked + full DOM | 6.5 s | 32.2 s | 61.0 s, then timed out while scrolling |
| main + virtual | 0.12 s | 0.37 s | 0.56 s |
| worker whole + virtual | 0.20 s | 0.30 s | 0.38 s |
| **worker chunked + virtual (the app)** | **0.16 s** | **0.26 s** | **0.36 s** |

| 500,000 rows | normal CPU | 4× slower | 6× slower |
|---|---|---|---|
| any full DOM variant | timed out at 180 s | timed out | timed out |
| main + virtual | 0.28 s | 0.81 s | 1.2 s |
| worker whole + virtual | 0.41 s | 0.65 s | 0.82 s |
| **worker chunked + virtual (the app)** | **0.35 s** | **0.53 s** | **0.71 s** |

### Longest freeze of the main thread (long task, ms)

| 200,000 rows | normal | 4× | 6× |
|---|---|---|---|
| main + full DOM | 4,730 | 21,293 | 32,569 |
| worker whole + full DOM | 1,985 | 1,531 | 2,283 |
| worker chunked + full DOM | 1,678 | 179 (15 tasks) | 12,837 (46 tasks) |
| main + virtual | 60 | 229 | 341 |
| worker whole + virtual | 0 | 100 | 151 |
| **worker chunked + virtual** | **0** | **0** | **0** |

| 500,000 rows | normal | 4× | 6× |
|---|---|---|---|
| main + virtual | 163 | 599 | 869 |
| worker whole + virtual | 86 | 295 | 433 |
| **worker chunked + virtual** | **0** | **0** | **0** |

### Other measures, 200,000 rows at normal CPU

| | full DOM | virtual |
|---|---|---|
| Elements on the page | about 1,800,000 | about 326 |
| Browser process memory | 8 to 9 GB | about 0.3 GB |
| Scroll jump, average | 205 to 290 ms, every jump a long task | 34 ms, no long tasks |

At 500,000 rows the virtual variants use about 130 MB of JavaScript heap (roughly 0.26 KB per row) and about 0.45 GB of browser process memory. Full DOM reached 10 to 12 GB before timing out; a separate attempt with a 10-minute budget ended with Chrome reporting "Page crashed".

### What the benchmark says, in plain words

1. **Virtualization is the decision that matters.** Rendering every row takes seconds to tens of seconds, creates 1.8 million elements, uses gigabytes, and makes every scroll step a freeze. At 500,000 rows it does not finish. Virtual rendering is interactive in a fraction of a second with a few hundred elements, regardless of file size.
2. **The worker buys a free main thread, not raw speed.** Parsing on the main thread is actually the fastest on a fast laptop, 0.12 s, but that time is a freeze, and it grows to nearly a second at 500,000 rows on a slow CPU. Sending all rows back from a worker in one message only moves the freeze into unpacking the message.
3. **Chunking is what gets the freeze count to zero.** The chunked worker variant had no long task in any of its six runs, and it shows the first rows earliest, about 60 to 120 ms after navigation, because it does not wait for the whole file.
4. **A slower CPU barely touches the chosen design** (0.16 s to 0.36 s at 200k, 0.35 s to 0.71 s at 500k) **and turns full DOM from slow into unusable.**
5. **Rendering everything also slows parsing down**: with chunked parsing and full rendering, the last chunk arrived after 4.8 s instead of 0.15 s, because each chunk's messages queued behind the DOM work of the previous one. Keeping the per-chunk work on the main thread small is what keeps the pipeline flowing.

### Caveats

- Chrome's CPU throttling slows only the main thread, not the worker. Under throttling the worker variants understate what a slow device would spend inside the worker; the main-thread numbers, which are the point, are unaffected.
- Each cell is a single run, but the whole matrix was measured twice while the harness was being fixed and the two passes agreed within a few percent.
- The full-DOM page used plain DOM with no framework and no event handlers. With React it would be slower still.

## 3. Smaller measurements that decided details

**Sorting comparator** (Node, sorting 200,000 row positions, best of 3). This reversed an earlier assumption that dictionary-order comparison is much slower than plain comparison.

| Comparator | by country (few distinct values) | by email (mostly unique) |
|---|---|---|
| plain code-point `<` | 32 ms | 161 ms |
| `localeCompare` / `Intl.Collator` (chosen) | 37 ms | 128 ms |
| lowercase then `<` | 54 ms | 348 ms |

**Duplicate check placement.** On the main thread after the last chunk: 54 ms, one long task of 56 ms together with the recount. Moved into the worker, which already holds the rows: 0 long tasks during load. The main thread keeps its own copy of the check for re-checks after an edit, and runs it only when an email or ID was touched.

**Search scan** over 200,000 rows × 8 cells in Node: 26 ms, which is why search runs on the main thread after a 200 ms typing pause rather than in the worker.
