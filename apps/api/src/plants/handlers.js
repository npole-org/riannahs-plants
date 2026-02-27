import { json } from '../http/json.js';
import { parseCreatePlantInput } from '../routes/plants.js';

function requireSession(session) {
  if (!session?.userId) {
    throw new Error('unauthorized');
  }
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

export async function createPlantHandler(request, { plantsRepo, session }) {
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
    input = parseCreatePlantInput(payload);
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
