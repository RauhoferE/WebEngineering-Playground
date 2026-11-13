import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Bear, BearId, BearList } from '../schemas/bear.js';

const validBear = {
  id: 'u-arctos',
  name: 'Brown bear',
  binomial: 'U. arctos',
  imageUrl: 'https://upload.wikimedia.org/brown-bear.jpg',
  range: 'Eurasia and North America',
};

await test('BearId accepts lowercase slugs', () => {
  for (const id of ['u-arctos', 'a-melanoleuca', 'ursus', 'h-malayanus']) {
    assert.equal(BearId.safeParse(id).success, true, id);
  }
});

await test('BearId rejects anything that is not a lowercase slug', () => {
  const invalid = [
    '',
    'U-arctos',
    'u--arctos',
    '-u-arctos',
    'u-arctos-',
    'u arctos',
    'u.arctos',
    'u-arctos1',
    'ü-arctos',
  ];
  for (const id of invalid) {
    assert.equal(BearId.safeParse(id).success, false, id);
  }
});

await test('Bear accepts a complete bear', () => {
  assert.deepEqual(Bear.parse(validBear), validBear);
});

await test('Bear allows a missing image as null', () => {
  assert.equal(Bear.parse({ ...validBear, imageUrl: null }).imageUrl, null);
});

await test('Bear rejects an image that is not a URL', () => {
  const result = Bear.safeParse({ ...validBear, imageUrl: 'brown-bear.jpg' });
  assert.equal(result.success, false);
  assert.deepEqual(result.error?.issues[0]?.path, ['imageUrl']);
});

await test('Bear rejects an empty name or binomial', () => {
  assert.equal(Bear.safeParse({ ...validBear, name: '' }).success, false);
  assert.equal(Bear.safeParse({ ...validBear, binomial: '' }).success, false);
});

await test('Bear rejects a missing range', () => {
  const { range: _range, ...withoutRange } = validBear;
  assert.equal(Bear.safeParse(withoutRange).success, false);
});

await test('Bear strips storage-only fields from database rows', () => {
  const parsed = Bear.parse({
    ...validBear,
    position: 6,
    fetchedAt: new Date(),
  });
  assert.deepEqual(Object.keys(parsed).sort(), Object.keys(validBear).sort());
});

await test('BearList requires the items envelope', () => {
  assert.equal(BearList.safeParse({ items: [validBear] }).success, true);
  assert.equal(BearList.safeParse({ items: [] }).success, true);
  assert.equal(BearList.safeParse([validBear]).success, false);
});
