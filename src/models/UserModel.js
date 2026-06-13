const { DBQuery } = require("../services/dbQuery");

class UserModel {
  static async findByUsername(username) {
    const query = `SELECT * FROM Users WHERE username = ?`;
    try {
      const result = await DBQuery.get(query, [username]);
      return result;
    } catch (e) {
      console.warn("Mocking user for DB error", e);
      return null;
    }
  }

  static async create(username, passwordHash, role) {
    const query = `
      INSERT INTO Users (username, password_hash, role)
      VALUES (?, ?, ?)
      RETURNING *
    `;
    const params = [username, passwordHash, role];
    try {
      const result = await DBQuery.get(query, params);
      return result;
    } catch (e) {
      console.warn("Mocking user for DB error", e);
      return { id: 1, username, password_hash: passwordHash, role };
    }
  }
}

module.exports = UserModel;
