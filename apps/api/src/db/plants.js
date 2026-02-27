export function createPlantsRepo(db) {
  return {
    async listByOwner(ownerUserId) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const { results } = await db
        .prepare(
          'SELECT id, owner_user_id, nickname, species_common, species_scientific, acquired_on, notes, created_at FROM plants WHERE owner_user_id = ?1 ORDER BY created_at DESC'
        )
        .bind(ownerUserId)
        .all();

      return results || [];
    },

    async createPlant(plant) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      await db
        .prepare(
          'INSERT INTO plants (id, owner_user_id, nickname, species_common, species_scientific, acquired_on, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)'
        )
        .bind(
          plant.id,
          plant.owner_user_id,
          plant.nickname,
          plant.species_common,
          plant.species_scientific,
          plant.acquired_on,
          plant.notes,
          plant.created_at
        )
        .run();

      return plant;
    }
  };
}
