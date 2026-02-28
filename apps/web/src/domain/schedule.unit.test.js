import { isDueOnOrBefore } from './schedule';

describe('isDueOnOrBefore', () => {
  test('returns true when due date is before now', () => {
    const now = new Date('2026-02-27T12:00:00Z');
    expect(isDueOnOrBefore('2026-02-26T12:00:00Z', now)).toBe(true);
  });

  test('returns false when due date is after now', () => {
    const now = new Date('2026-02-27T12:00:00Z');
    expect(isDueOnOrBefore('2026-03-01T12:00:00Z', now)).toBe(false);
  });

  test('returns false for invalid date input', () => {
    expect(isDueOnOrBefore('not-a-date')).toBe(false);
  });
});
