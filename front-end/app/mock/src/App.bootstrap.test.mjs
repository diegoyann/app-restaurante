import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

test('tenant dashboard uses real transaction data instead of seeded revenue chart mock', async () => {
  const appSource = await readFile(join(currentDir, 'App.jsx'), 'utf8');

  assert.match(appSource, /const USE_REVENUE_CHART_MOCK = false;/);
});
