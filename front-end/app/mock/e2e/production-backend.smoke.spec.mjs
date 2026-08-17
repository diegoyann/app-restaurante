import { test, expect } from '@playwright/test';

const BACKEND_ORIGIN = 'https://rei-das-esfihas-backend.vercel.app';

test('the published menu loads data from the published backend', async ({ page }) => {
  const backendFailures = [];
  const browserErrors = [];

  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BACKEND_ORIGIN)) {
      backendFailures.push(`${request.url()}: ${request.failure()?.errorText || 'request failed'}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  const backendResponse = page.waitForResponse(
    (response) => response.url().startsWith(BACKEND_ORIGIN) && response.request().resourceType() === 'fetch'
  );

  await page.goto('/cardapio/bady-bassitt', { waitUntil: 'domcontentloaded' });
  const response = await backendResponse;

  expect(response.ok(), `Backend returned HTTP ${response.status()}`).toBeTruthy();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/falha ao carregar|failed to fetch|não foi possível carregar/i)).toHaveCount(0);
  expect(backendFailures).toEqual([]);
  expect(browserErrors.filter((message) => /cors|failed to fetch|networkerror/i.test(message))).toEqual([]);
});
