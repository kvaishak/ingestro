# Ingestro case study: review and fix a messy CSV

Frontend-only prototype for the Ingestro case study. Loads a CSV with 200,000 customer rows, checks every value while loading, shows what is wrong in plain words, and allows fixing problems one by one or in bulk, with undo. Everything runs in the browser; nothing is uploaded.

Design document: [DESIGN.md](./DESIGN.md).

## Setup

Requires Node 20 or newer.

```bash
npm install
node scripts/generate-data.mjs        # writes import-data.csv (200,000 rows) into the project folder
npm run dev                           # http://localhost:5173
```

In the app, **Choose file** opens `import-data.csv` from disk. **Try with sample data** loads `public/sample.csv`, a 200-row file made with the same generator (`node scripts/generate-data.mjs 200 42`).

To start the app with a file already loading, place the file in `public/` and add `?load=<name>` to the URL:

```bash
cp import-data.csv public/
# http://localhost:5173/?load=import-data.csv
```

## Commands

```bash
npm run dev       # dev server
npm test          # unit tests (Vitest)
npm run check     # lint + type check + tests; run before every commit
npm run build     # production build into dist/
npm run preview   # serve the production build on http://localhost:4173
```

## Generator

`scripts/generate-data.mjs` is the generator from the case study, unchanged. It is deterministic: the same arguments always produce the same file.

## Features

- **Load**: rows appear while a progress bar fills.
- **Grid**: scrolls through all rows, search across every column, sort by clicking a column header.
- **Problems**: the left panel shows how close the file is to importable and every kind of problem with a count. Selecting one filters the grid to those rows and explains what is wrong and what a good value looks like.
- **Fix a cell**: double-click (or Enter on a focused cell), type, and the editor shows whether the value is right before saving. The row stays in place; counts update at once.
- **Bulk fix for countries**: on "Country is not a two-letter code", the panel reports how many spellings it recognises (Germany, Deutschland, USA, …). A review list shows every change; after confirming, all are applied as one step.
- **Undo** the last change from the toast or with Cmd/Ctrl+Z. **Revert all changes** in the toolbar restores every value from the file; the revert itself can be undone.
- **Import** stays disabled until no problems remain. The import itself is not part of this prototype.

## Project layout

```
src/main.tsx      starts React
src/App.tsx       the whole screen: the file picker, then status bar, problems panel, toolbar and grid
src/format.ts     how numbers are shown to the user ("12,345")
src/validation/   the rules: the column schema, every problem type with its wording (catalog.ts),
                  one check per column (rules.ts), the duplicate check, and the country codes and spellings
src/worker/       reads the CSV in chunks in a Web Worker and validates each chunk before sending it on
src/store/        the data, kept outside React: rows and their issue marks, loading, search and sort,
                  the change engine with undo, counts, suggestions and the bulk plan;
                  useStore.ts is the one hook that lets React re-render when the store changes
src/ui/           the React components, one folder per area of the screen:
  actions.ts        every user action inside the workspace that changes something
  session.ts        UI-only state: which cell is being edited, the toast, what the panel shows
  loading/          file picker and the loading status bar
  panel/            the problems panel on the left: readiness, problem list, detail, bulk preview and result
  toolbar/          search, filter chip, row count, revert all, import
  grid/             the virtualized grid, its header, rows, cells and the inline editor
  common/           confirm dialog and toast
  hooks/            Cmd/Ctrl+Z undo and ?load= on start
src/test/         test data shared by every test (fixtures.ts)
scripts/          the data generator from the case study
public/           the sample file
```

Tests sit next to the code they cover (`*.test.ts`).

## Where do I start?

| I want to… | Look in |
|---|---|
| change what counts as a problem, or its wording | `src/validation/catalog.ts` (wording) and `src/validation/rules.ts` (the check) |
| change how a value is written, undone or reverted | `src/store/changes.ts`; `applyChange` is the only function that writes a value |
| change which rows the grid shows (filter, search, sort) | `src/store/query.ts`, `buildView` |
| change what a button does | `src/ui/actions.ts`, then the component that calls it |
| change how the file is read | `src/store/load.ts` (main thread) and `src/worker/parse.worker.ts` |

Once a file is loaded, components read from `store`, `query` and `session`, and change things only through `ui/actions.ts`. Two exceptions: loading a file goes through `store/load.ts`, and opening/closing the cell editor or dismissing the toast are plain setters in `ui/session.ts`.
