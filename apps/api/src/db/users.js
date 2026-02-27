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
    }
  };
}
