import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AI_BEHAVIOR_SETTINGS,
  mapAiBehaviorSettings
} from './settingsProjection.js';

test('mapAiBehaviorSettings returns safe defaults for a new empty tenant', () => {
  assert.deepEqual(mapAiBehaviorSettings(null), DEFAULT_AI_BEHAVIOR_SETTINGS);
});

test('mapAiBehaviorSettings preserves a disabled auto-publish setting', () => {
  assert.deepEqual(mapAiBehaviorSettings({
    positive_tone: 'formal',
    crisis_strategy: 'email',
    additional_instructions: 'Assine como gerente.',
    auto_publish_positive: false
  }), {
    positiveTone: 'formal',
    crisisStrategy: 'email',
    additionalInstructions: 'Assine como gerente.',
    autoPublishPositive: false
  });
});
