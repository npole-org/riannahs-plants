import { json } from '../http/json.js';
import { parseCreatePlantInput } from '../routes/plants.js';

function requireSession(session) {
  if (!session?.userId) {
    throw new Error('unauthorized');
  }
}

async function parsePlantPayload(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    throw new Error('invalid_json');
  }

  return parseCreatePlantInput(payload);
}

export async function listPlantsHandler({ plantsRepo, session }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const plants = await plantsRepo.listByOwner(session.userId);
  return json(200, { ok: true, plants });
}

export async function getPlantHandler({ plantsRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const plant = await plantsRepo.getById({ id: plantId, ownerUserId: session.userId });
  if (!plant) {
    return json(404, { ok: false, error: 'plant_not_found' });
  }

  return json(200, { ok: true, plant });
}

export async function createPlantHandler(request, { plantsRepo, session }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let input;
  try {
    input = await parsePlantPayload(request);
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  const plant = await plantsRepo.createPlant({
    id: crypto.randomUUID(),
    owner_user_id: session.userId,
    ...input,
    created_at: new Date().toISOString()
  });

  return json(201, { ok: true, plant });
}

export async function updatePlantHandler(request, { plantsRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  let input;
  try {
    input = await parsePlantPayload(request);
  } catch (error) {
    return json(400, { ok: false, error: error.message || 'invalid_body' });
  }

  const updated = await plantsRepo.updatePlant({
    id: plantId,
    ownerUserId: session.userId,
    ...input
  });

  if (!updated) {
    return json(404, { ok: false, error: 'plant_not_found' });
  }

  return json(200, { ok: true, plant: updated });
}

export async function deletePlantHandler({ plantsRepo, session, plantId }) {
  try {
    requireSession(session);
  } catch {
    return json(401, { ok: false, error: 'unauthorized' });
  }

  const removed = await plantsRepo.deletePlant({ id: plantId, ownerUserId: session.userId });
  if (!removed) {
    return json(404, { ok: false, error: 'plant_not_found' });
  }

  return json(200, { ok: true });
}
