import { describe, expect, test } from 'vitest';
import { schemaSql } from '../src/db/schema.js';

describe('schemaSql', () => {
  test('contains users and plants tables', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS plants');
  });
});
