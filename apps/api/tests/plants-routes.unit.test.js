import { describe, expect, test } from 'vitest';
import { parseCreatePlantInput } from '../src/routes/plants.js';

describe('parseCreatePlantInput', () => {
  test('parses minimal valid payload', () => {
    expect(parseCreatePlantInput({ nickname: 'Pothos' })).toEqual({
      nickname: 'Pothos',
      species_common: null,
      species_scientific: null,
      acquired_on: null,
      notes: null
    });
  });

  test('throws on invalid body', () => {
    expect(() => parseCreatePlantInput(null)).toThrow('invalid_body');
  });

  test('throws on missing nickname', () => {
    expect(() => parseCreatePlantInput({ nickname: '   ' })).toThrow('missing_nickname');
  });
});
