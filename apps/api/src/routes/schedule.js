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

export function parseScheduleConfigInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const next_water_on = body.next_water_on == null ? null : String(body.next_water_on).trim();
  const next_repot_on = body.next_repot_on == null ? null : String(body.next_repot_on).trim();

  if (!next_water_on && !next_repot_on) {
    throw new Error('missing_schedule_fields');
  }

  return { next_water_on, next_repot_on };
}
