export function createUsersRepo(db) {
  return {
    async findByEmail(email) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      return db
        .prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?1 LIMIT 1')
        .bind(email)
        .first();
    },

    async createUser({ id, email, passwordHash, role, createdAt }) {
      if (!db) {
        throw new Error('db_not_bound');
      }

      await db
        .prepare('INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?1, ?2, ?3, ?4, ?5)')
        .bind(id, email, passwordHash, role, createdAt)
        .run();

      return { id, email, role, created_at: createdAt };
    }
  };
}
