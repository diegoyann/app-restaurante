import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectionFiles = [
  'catalogProjection.js',
  'financeProjection.js',
  'hrProjection.js',
  'settingsProjection.js'
];

test('projection Promise.all arrays receive pending queries instead of already awaited results', async () => {
  for (const file of projectionFiles) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8');
    const promiseAllBlocks = source.match(/Promise\.all\(\[[\s\S]*?\]\)/gu) || [];

    for (const block of promiseAllBlocks) {
      assert.doesNotMatch(
        block,
        /await\s+supabaseAdmin/gu,
        `${file} awaits a Supabase query before Promise.all can parallelize it`
      );
    }
  }
});
