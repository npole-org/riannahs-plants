export function parseCreatePlantInput(body) {
  if (!body || typeof body !== 'object') {
    throw new Error('invalid_body');
  }

  const nickname = String(body.nickname ?? '').trim();
  const species_common = body.species_common == null ? null : String(body.species_common).trim();
  const species_scientific = body.species_scientific == null ? null : String(body.species_scientific).trim();
  const acquired_on = body.acquired_on == null ? null : String(body.acquired_on).trim();
  const notes = body.notes == null ? null : String(body.notes).trim();

  if (!nickname) {
    throw new Error('missing_nickname');
  }

  return {
    nickname,
    species_common,
    species_scientific,
    acquired_on,
    notes
  };
}
