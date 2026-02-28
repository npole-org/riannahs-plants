import { describe, expect, test } from 'vitest';
import { schemaSql } from '../src/db/schema.js';

describe('schemaSql', () => {
  test('contains users, plants, and plant_events tables', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS plants');
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS plant_events');
  });
});
