import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vercelConfig = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')
);

test('backend function allows enough time for a cold tenant bootstrap', () => {
  const maxDuration = vercelConfig.functions?.['api/index.js']?.maxDuration;

  assert.ok(
    Number(maxDuration) >= 30,
    `Expected api/index.js maxDuration >= 30 seconds, received ${maxDuration}`
  );
});
