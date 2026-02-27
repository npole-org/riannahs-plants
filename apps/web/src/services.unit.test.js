import { describe, expect, test } from 'vitest';
import { summaryService } from './services';

describe('summaryService', () => {
  test('returns default summary payload', async () => {
    await expect(summaryService.getSummary()).resolves.toEqual({
      plants: 0,
      dueToday: 0
    });
  });
});
