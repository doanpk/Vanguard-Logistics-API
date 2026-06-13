const { dbPromise } = require("../config/db");

class DBQuery {
  static async all(queryText, params = []) {
    return await dbPromise.all(queryText, params);
  }

  static async get(queryText, params = []) {
    return await dbPromise.get(queryText, params);
  }

  static async run(queryText, params = []) {
    return await dbPromise.run(queryText, params);
  }

  // Generic basic CRUD helpers
  static async findAll(tableName) {
    return await dbPromise.all(`SELECT * FROM ${tableName}`);
  }

  static async findById(tableName, id) {
    return await dbPromise.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
  }

  static async deleteById(tableName, id) {
    const result = await dbPromise.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }
}

module.exports = { DBQuery };
