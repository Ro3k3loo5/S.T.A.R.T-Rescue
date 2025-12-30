# GitHub Copilot / AI Agent Instructions for S.T.A.R.T-Rescue

Summary
- Small static Progressive Web App (PWA) for pre-hospital handover and CPR/vitals logging.
- Single-page app implemented with ES modules (no bundler). Serve over HTTP(S) when running locally.

Big picture (architecture & dataflow) ✅
- UI is a single-page app (tabs) wired by `index.html` → `app.js` which coordinates modules.
- Core feature modules (one-per-file): `patient.js`, `vitals.js`, `gcs.js`, `notes.js`, `cpr.js`, `results.js`.
- Each module keeps its own in-memory arrays (e.g., `vitalsLog`, `gcsLog`, `notesLog`) and persists to `localStorage` using string keys like `vitalsLog`, `gcsLog`, `patients`, `patientInfo`, `cprLog`, `cprEvents`, `cprTimeline`.
- Timeline and logs are "newest first" arrays (modules use `unshift`) and cap at 200 entries.
- The PWA service worker (`sw.js`) caches application assets. `app.js` contains helper functions (`checkForUpdates`, `applyUpdate`) that interact with the SW via `postMessage({type:'SKIP_WAITING'})`.

Critical developer workflows 🔧
- There is no build/test toolchain. To run locally: serve the directory with a static server (examples):
  - VS Code Live Server extension
  - python: `python -m http.server 8000` (open `http://localhost:8000`)
  - Node http-server: `npx http-server .`
- To test service worker changes: open DevTools → Application → Service Workers, unregister the SW, and clear caches or use the built-in `applyUpdate()` flow in the UI which posts `SKIP_WAITING`.
- Debugging: use browser DevTools console and Application → Local Storage to inspect keys noted above.

Project-specific conventions & gotchas ⚠️
- HTML relies on functions being attached to `window` (see bottom of `app.js`). Any function called by `onclick` must be exported from its module and assigned to `window.<name>` in `app.js` (e.g., `window.submitVitals = submitVitals;`).
- Timestamping: code calls a helper `nowTimestamp()` in many modules but the helper is missing in the repo — expect failing imports and add a small util (e.g., `utils.js`) exporting `nowTimestamp()`.
- Import/export mismatches: several modules import variables that are not exported by `patient.js` (e.g., `patientInfo`, `vitalsLog`, `gcsLog`, `notesLog`, `currentPatientId`, `patients` are referenced widely but not consistently exported). Before changes: reconcile exports in `patient.js` or centralize state into a single `store.js`.
- `index.html` content issue (MAJOR): currently `index.html` contains the service worker JS (duplicate content of `sw.js`) instead of the app HTML. This blocks manual testing. Investigate git history or restore the correct `index.html`.
- Modules use identical helper names like `saveToLocalStorage()` inside each file — they're module-scoped but keep naming consistent; prefer a single shared save/load strategy if consolidating state.

Guidance for common tasks (concrete examples) 💡
- Adding a new button-handled action: export function from module, import in `app.js`, then add `window.<name> = <name>` so the existing HTML `onclick` will work.
- Add a new persisted list: follow pattern in other files: keep "newest-first" (`unshift`), cap at 200 entries, and persist with `localStorage.setItem(key, JSON.stringify(...))`.
- Fixing the missing `nowTimestamp()`: implement `export function nowTimestamp() { return new Date().toLocaleTimeString(); }` and export from a lightweight `utils.js`, then import in modules that call it.

Tests & CI
- No unit tests or CI present. Keep changes small and test manually by serving the app and exercising the UI flows.

Files to review first (high value) 🔍
- `index.html` — restore correct HTML; current file appears to be SW JS and must be corrected before local browser testing.
- `app.js` — entry point and the place to expose global functions; contains PWA update helpers.
- `patient.js` — central state; reconcile exports (`patientInfo`, `patients`, `currentPatientId`) so other modules can import reliably.
- `vitals.js`, `gcs.js`, `notes.js`, `cpr.js`, `results.js` — logical examples of log patterns, formatting, and UI rendering.
- `sw.js` and `manifest.json` — PWA behavior and caching strategy (update `CACHE_NAME` to force cache refreshes during manual testing).

If you want me to: ✅
- I can draft a small `utils.js` with `nowTimestamp()` and update imports.
- I can propose a minimal `store.js` to centralize exports from `patient.js` and convert other modules to import from it.
- I can restore `index.html` if you have a known good version, or attempt a minimal skeleton to get the UI back and enable manual testing.

---
Please tell me which of the follow-up items you'd like me to do next (implement util, central store, or restore `index.html`), or point me at a working `index.html` to restore. I'll proceed with the selected task and run the changes locally in a static server for a quick smoke test. 👇
