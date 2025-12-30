import { test, expect } from '@playwright/test';

test.describe('S.T.A.R.T-Rescue smoke', () => {
  test('core flows', async ({ page }) => {
    page.on('console', msg => console.log(`PAGE LOG: ${msg.type()} ${msg.text()}`));
    page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
    page.on('requestfailed', req => console.log(`REQUEST FAILED: ${req.url()} ${req.failure()?.errorText || ''}`));

    // Go to app (uses baseURL from config)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Unregister service workers to avoid caching interfering with test
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    });

    await page.reload({ waitUntil: 'networkidle' });

    // Add a patient
    await page.click('#add-patient-btn');
    await page.waitForSelector('.patient-chip', { timeout: 5000 });
    const patientChips = await page.locator('.patient-chip').count();
    expect(patientChips).toBeGreaterThan(0);

    // Fill basic patient fields
    await page.fill('#patient-name', 'Test Patient');
    await page.fill('#responder-id', 'Unit 1');

    // Vitals
    await page.click('text=Vitals');
    await page.fill('#bp-sys', '120');
    await page.fill('#bp-dia', '80');
    await page.fill('#pulse', '72');
    await page.fill('#spo2', '98');
    await page.fill('#rrate', '16');
    await page.fill('#temp', '36.8');
    await page.evaluate(() => window.submitVitals());
    await page.waitForSelector('#vitals-log .log-item', { timeout: 5000 });
    expect(await page.locator('#vitals-log').innerText()).toContain('Pulse');

    // GCS
    await page.click('text=GCS');
    await page.check('input[name="gcs-eye"][value="4"]');
    await page.check('input[name="gcs-verbal"][value="5"]');
    await page.check('input[name="gcs-motor"][value="6"]');
    await page.evaluate(() => window.submitGCS());
    await page.waitForSelector('#gcs-log .log-item', { timeout: 5000 });
    expect(await page.locator('#gcs-log').innerText()).toContain('Total');

    // Notes
    await page.click('text=Notes');
    await page.fill('#general-note', 'Automated test note');
    await page.evaluate(() => window.addNote());
    await page.waitForSelector('#notes-log .log-item', { timeout: 5000 });
    expect(await page.locator('#notes-log').innerText()).toContain('Automated test note');

    // CPR - start then stop
    await page.evaluate(() => window.startCPR());
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.stopCPR());

    const cprTimeline = await page.evaluate(() => JSON.parse(localStorage.getItem('cprTimeline') || '[]'));
    expect(cprTimeline.length).toBeGreaterThan(0);

    // Results
    await page.evaluate(() => window.showResults());
    await page.waitForSelector('#results-output', { timeout: 3000 });
    const resultsValue = await page.locator('#results-output').inputValue();
    expect(resultsValue.length).toBeGreaterThan(10);
    expect(resultsValue).toContain('Test Patient');
  });
});
