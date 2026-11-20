import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLaymanProgress,
  filterLaymanGuides,
  getExplanationByTone,
  LAYMAN_MODULE_GUIDES,
} from './laymanExplanations';
import { runPythonCode } from '../engine/pythonRunner';

test('all 13 curriculum modules have complete baby & layman guides', () => {
  assert.equal(LAYMAN_MODULE_GUIDES.length, 13);
  for (let id = 1; id <= 13; id++) {
    const guide = LAYMAN_MODULE_GUIDES.find((g) => g.moduleId === id);
    assert.ok(guide, `Missing guide for module ${id}`);
    assert.ok(guide!.babyStory.paragraphs.length >= 2);
    assert.ok(guide!.laymanStory.paragraphs.length >= 2);
    assert.ok(guide!.visualSteps.length === 3);
    assert.ok(guide!.codeTranslations.length >= 3);
    assert.ok(guide!.glossary.length >= 2);
    assert.ok(
      guide!.quickCheck.correctIndex >= 0 &&
        guide!.quickCheck.correctIndex < guide!.quickCheck.options.length
    );
  }
});

test('all 13 layman sampleCode snippets execute cleanly with runPythonCode', () => {
  for (const guide of LAYMAN_MODULE_GUIDES) {
    const res = runPythonCode(guide.sampleCode, guide.sampleInputs ?? []);
    assert.equal(
      res.success,
      true,
      `Sample code failed for module ${guide.moduleId}: ${res.errorMessage ?? 'unknown error'}`
    );
    assert.ok(res.output.length > 0, `Sample code produced empty output for module ${guide.moduleId}`);
  }
});

test('filterLaymanGuides filters accurately by category and keyword across glossary and analogies', () => {
  const byCategory = filterLaymanGuides(LAYMAN_MODULE_GUIDES, '', 'OOP & Kualitas Kode');
  assert.equal(byCategory.length, 3);

  const byAnalogy = filterLaymanGuides(LAYMAN_MODULE_GUIDES, 'cetakan kue', 'Semua');
  assert.equal(byAnalogy.length, 1);
  assert.equal(byAnalogy[0].moduleId, 11);

  const byGlossary = filterLaymanGuides(LAYMAN_MODULE_GUIDES, 'modulo', 'Semua');
  assert.equal(byGlossary.length, 1);
  assert.equal(byGlossary[0].moduleId, 3);

  const empty = filterLaymanGuides(LAYMAN_MODULE_GUIDES, 'kata-yang-tidak-ada-xyz', 'Semua');
  assert.equal(empty.length, 0);
});

test('getExplanationByTone and calculateLaymanProgress return expected values', () => {
  const mod1 = LAYMAN_MODULE_GUIDES[0];
  assert.equal(getExplanationByTone(mod1, 'bayi').headline, mod1.babyStory.headline);
  assert.equal(getExplanationByTone(mod1, 'awam').headline, mod1.laymanStory.headline);

  assert.deepEqual(calculateLaymanProgress([], 13), {
    understoodCount: 0,
    totalCount: 13,
    percent: 0,
  });
  assert.deepEqual(calculateLaymanProgress([1, 2, 2, 13, 99], 13), {
    understoodCount: 3,
    totalCount: 13,
    percent: 23,
  });
});
