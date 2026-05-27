import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultAiBehaviorSettings,
  normalizeAiBehaviorSettings
} from './settingsModel.js';

test('normalizeAiBehaviorSettings returns safe defaults for an empty tenant', () => {
  assert.deepEqual(normalizeAiBehaviorSettings(null), createDefaultAiBehaviorSettings());
  assert.deepEqual(normalizeAiBehaviorSettings({}), createDefaultAiBehaviorSettings());
});

test('normalizeAiBehaviorSettings preserves explicit saved values', () => {
  assert.deepEqual(normalizeAiBehaviorSettings({
    positiveTone: 'formal',
    crisisStrategy: 'email',
    additionalInstructions: 'Assine como gerente.',
    autoPublishPositive: false
  }), {
    positiveTone: 'formal',
    crisisStrategy: 'email',
    additionalInstructions: 'Assine como gerente.',
    autoPublishPositive: false
  });
});
