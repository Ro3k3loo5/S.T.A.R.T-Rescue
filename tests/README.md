Playwright Smoke Tests

Prerequisites:
- Node.js (LTS) installed and in PATH

Install and run:

1. Install dev dependencies and Playwright browsers:

   npm run test:playwright:install

2. Run the smoke test:

   npm run test:playwright

Notes:
- The tests assume the app is served at http://localhost:8000. Start the server before running tests:
    py -3 -m http.server 8000
- Tests are headless by default; set `headless: false` in `playwright.config.js` or run `npx playwright test --headed` if you want to watch the browser.
- The tests unregister any registered service worker to avoid caching interfering with the run.

Traces, screenshots & reports
- The test config records a **trace** on the first retry, **screenshots** and **video** for failed tests. After a failing run you can view artifacts and the report with:

  npx playwright show-report

- If a test fails, the report will contain failure traces you can open in Playwright Trace Viewer, plus screenshots and video where available.

If you want, I can also change `trace: 'on'` to record traces for every run (larger artifacts).