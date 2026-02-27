const EVENT_TYPES = new Set(['water', 'repot']);

export function parseRecordPlantEventInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const type = String(body.type ?? '').trim().toLowerCase();
  const occurred_on = String(body.occurred_on ?? '').trim();
  const next_due_on = body.next_due_on == null ? null : String(body.next_due_on).trim();

  if (!EVENT_TYPES.has(type)) {
    throw new Error('invalid_event_type');
  }

  if (!occurred_on) {
    throw new Error('missing_occurred_on');
  }

  return { type, occurred_on, next_due_on };
}
