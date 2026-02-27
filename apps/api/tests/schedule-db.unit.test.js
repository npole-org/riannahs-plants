import { describe, expect, test } from 'vitest';
import { createScheduleRepo } from '../src/db/schedule.js';

describe('schedule repo', () => {
  test('throws when db is missing', async () => {
    const repo = createScheduleRepo(null);
    await expect(repo.listDueTasksByOwner('u1', '2026-02-27')).rejects.toThrow('db_not_bound');
  });

  test('recordPlantEvent throws when plant update affects zero rows', async () => {
    const db = {
      prepare(sql) {
        if (sql.startsWith('INSERT INTO plant_events')) {
          return {
            bind() {
              return { run: async () => ({ success: true }) };
            }
          };
        }

        return {
          bind() {
            return { run: async () => ({ meta: { changes: 0 } }) };
          }
        };
      }
    };

    const repo = createScheduleRepo(db);
    await expect(
      repo.recordPlantEvent({
        plantId: 'p1',
        ownerUserId: 'u1',
        type: 'water',
        occurredOn: '2026-02-27',
        nextDueOn: '2026-03-05'
      })
    ).rejects.toThrow('plant_not_found');
  });
});
