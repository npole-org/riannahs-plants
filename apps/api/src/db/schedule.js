export function createScheduleRepo(db) {
  return {
    async listDueTasksByOwner(ownerUserId, todayIsoDate) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const { results } = await db
        .prepare(
          `SELECT id, nickname, next_water_on, next_repot_on
           FROM plants
           WHERE owner_user_id = ?1
             AND ((next_water_on IS NOT NULL AND next_water_on <= ?2)
               OR (next_repot_on IS NOT NULL AND next_repot_on <= ?2))
           ORDER BY nickname ASC`
        )
        .bind(ownerUserId, todayIsoDate)
        .all();

      return results || [];
    },

    async recordPlantEvent({ plantId, ownerUserId, type, occurredOn, nextDueOn }) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      const eventId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await db
        .prepare(
          'INSERT INTO plant_events (id, plant_id, owner_user_id, type, occurred_on, next_due_on, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
        )
        .bind(eventId, plantId, ownerUserId, type, occurredOn, nextDueOn, createdAt)
        .run();

      const dueColumn = type === 'water' ? 'next_water_on' : 'next_repot_on';
      const result = await db
        .prepare(`UPDATE plants SET ${dueColumn} = ?1 WHERE id = ?2 AND owner_user_id = ?3`)
        .bind(nextDueOn, plantId, ownerUserId)
        .run();

      const changed = Number(result?.meta?.changes || 0);
      if (changed === 0) {
        throw new Error('plant_not_found');
      }

      return { id: eventId, plant_id: plantId, type, occurred_on: occurredOn, next_due_on: nextDueOn };
    }
  };
}
