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

    async listPublic() {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const { results } = await db
        .prepare(
          'SELECT id, nickname, species_common, species_scientific, acquired_on, notes, created_at FROM plants ORDER BY nickname ASC'
        )
        .all();

      return results || [];
    },

    async getById({ id, ownerUserId }) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const row = await db
        .prepare(
          'SELECT id, owner_user_id, nickname, species_common, species_scientific, acquired_on, notes, created_at FROM plants WHERE id = ?1 AND owner_user_id = ?2 LIMIT 1'
        )
        .bind(id, ownerUserId)
        .first();

      return row || null;
    },

    async getPublicById(id) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const row = await db
        .prepare(
          'SELECT id, nickname, species_common, species_scientific, acquired_on, notes, created_at FROM plants WHERE id = ?1 LIMIT 1'
        )
        .bind(id)
        .first();

      return row || null;
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
    },

    async updatePlant({ id, ownerUserId, nickname, species_common, species_scientific, acquired_on, notes }) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const result = await db
        .prepare(
          'UPDATE plants SET nickname = ?1, species_common = ?2, species_scientific = ?3, acquired_on = ?4, notes = ?5 WHERE id = ?6 AND owner_user_id = ?7'
        )
        .bind(nickname, species_common, species_scientific, acquired_on, notes, id, ownerUserId)
        .run();

      if (Number(result?.meta?.changes || 0) === 0) {
        return null;
      }

      return { id, owner_user_id: ownerUserId, nickname, species_common, species_scientific, acquired_on, notes };
    },

    async deletePlant({ id, ownerUserId }) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const result = await db
        .prepare('DELETE FROM plants WHERE id = ?1 AND owner_user_id = ?2')
        .bind(id, ownerUserId)
        .run();

      return Number(result?.meta?.changes || 0) > 0;
    }
  };
}
