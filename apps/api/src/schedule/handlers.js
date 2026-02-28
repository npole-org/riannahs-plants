import { json } from '../http/json.js';
import { parseRecordPlantEventInput, parseScheduleConfigInput } from '../routes/schedule.js';

function requireSession(session) {
  if (!session?.userId) {
    throw new Error('unauthorized');
  }
}

export async function dueTasksHandler({ scheduleRepo, session, now = new Date() }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const today = now.toISOString().slice(0, 10);
  const items = await scheduleRepo.listDueTasksByOwner(session.userId, today);

  const tasks = items.flatMap((plant) => {
    const due = [];
    if (plant.next_water_on && plant.next_water_on <= today) {
      due.push({ plant_id: plant.id, nickname: plant.nickname, type: 'water', due_on: plant.next_water_on });
    }
    if (plant.next_repot_on && plant.next_repot_on <= today) {
      due.push({ plant_id: plant.id, nickname: plant.nickname, type: 'repot', due_on: plant.next_repot_on });
    }
    return due;
  });

  return json(200, { ok: true, tasks });
}

export async function recordPlantEventHandler(request, { scheduleRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  let input;
  try {
    input = parseRecordPlantEventInput(payload);
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  try {
    const event = await scheduleRepo.recordPlantEvent({
      plantId,
      ownerUserId: session.userId,
      type: input.type,
      occurredOn: input.occurred_on,
      nextDueOn: input.next_due_on
    });

    return json(201, { ok: true, event });
  } catch (error) {
    if (error.message === 'plant_not_found') {
      return json(404, { ok: false, error: 'plant_not_found' });
    }
    throw error;
  }
}

export async function plantEventHistoryHandler({ scheduleRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const events = await scheduleRepo.listPlantEvents({ plantId, ownerUserId: session.userId });
  return json(200, { ok: true, events });
}

export async function configureScheduleHandler(request, { scheduleRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  let input;
  try {
    input = parseScheduleConfigInput(payload);
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  try {
    const schedule = await scheduleRepo.configurePlantSchedule({
      plantId,
      ownerUserId: session.userId,
      nextWaterOn: input.next_water_on,
      nextRepotOn: input.next_repot_on
    });
    return json(200, { ok: true, schedule });
  } catch (error) {
    if (error.message === 'plant_not_found') {
      return json(404, { ok: false, error: 'plant_not_found' });
    }
    throw error;
  }
}
