import { expect, test } from '@playwright/test';

const storageState = process.env.E2E_STORAGE_STATE;
const tenantSlug = process.env.E2E_TENANT_SLUG || 'teste-02';

test.use({ storageState: storageState || undefined });

test('bootstrap autenticado permanece rápido e íntegro em três recargas', async ({ page }) => {
  test.skip(!storageState, 'Defina E2E_STORAGE_STATE com uma sessão Supabase válida.');
  test.setTimeout(60_000);

  const consoleErrors = [];
  const failedRequests = [];
  const bootstrapSamples = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));
  page.on('response', async (response) => {
    if (!response.url().includes('/api/app/bootstrap')) return;
    const timing = response.request().timing();
    const body = await response.body();
    bootstrapSamples.push({
      status: response.status(),
      durationMs: timing.responseEnd,
      bytes: body.byteLength,
      requestId: response.headers()['x-request-id'] || ''
    });
  });

  await page.goto(`/app/${tenantSlug}`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await page.reload();
    await expect(page.getByText('Painel Administrativo')).toBeVisible();
    await expect(page.getByText('Falha ao carregar o backend')).toHaveCount(0);
  }

  expect(bootstrapSamples).toHaveLength(3);
  expect(bootstrapSamples.every((sample) => sample.status === 200)).toBe(true);
  expect(bootstrapSamples.every((sample) => sample.durationMs < 5_000)).toBe(true);

  for (const hash of ['dashboard', 'finance', 'hr', 'menu']) {
    await page.evaluate((nextHash) => { window.location.hash = nextHash; }, hash);
    await expect(page.getByText('Falha ao carregar o backend')).toHaveCount(0);
  }

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  test.info().annotations.push({ type: 'bootstrap-samples', description: JSON.stringify(bootstrapSamples) });
});
