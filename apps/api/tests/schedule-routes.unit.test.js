import { describe, expect, test } from 'vitest';
import { parseRecordPlantEventInput } from '../src/routes/schedule.js';

describe('parseRecordPlantEventInput', () => {
  test('parses valid event payload', () => {
    expect(parseRecordPlantEventInput({ type: 'water', occurred_on: '2026-02-27', next_due_on: '2026-03-05' })).toEqual({
      type: 'water',
      occurred_on: '2026-02-27',
      next_due_on: '2026-03-05'
    });
  });

  test('rejects invalid body', () => {
    expect(() => parseRecordPlantEventInput(null)).toThrow('invalid_body');
  });

  test('rejects invalid event type', () => {
    expect(() => parseRecordPlantEventInput({ type: 'feed', occurred_on: '2026-02-27' })).toThrow('invalid_event_type');
  });

  test('rejects missing occurred_on', () => {
    expect(() => parseRecordPlantEventInput({ type: 'water', occurred_on: '   ' })).toThrow('missing_occurred_on');
  });
});
