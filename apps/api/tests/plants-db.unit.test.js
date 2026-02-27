import { describe, expect, test } from 'vitest';
import { createPlantsRepo } from '../src/db/plants.js';

describe('plants repo', () => {
  test('throws when db is missing', async () => {
    const repo = createPlantsRepo(null);
    await expect(repo.listByOwner('u1')).rejects.toThrow('db_not_bound');
    await expect(repo.createPlant({})).rejects.toThrow('db_not_bound');
  });
});
