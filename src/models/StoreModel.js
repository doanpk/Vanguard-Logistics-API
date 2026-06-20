const { DBQuery } = require("../services/dbQuery");

class StoreModel {
  static async getMenuItems(storeId) {
    const query = `SELECT * FROM MenuItems WHERE store_id = ? ORDER BY created_at DESC`;
    return await DBQuery.all(query, [storeId]);
  }

  static async addMenuItem(storeId, name, price, description) {
    const query = `
      INSERT INTO MenuItems (store_id, name, price, description)
      VALUES (?, ?, ?, ?)
    `;
    const result = await DBQuery.run(query, [storeId, name, price, description]);
    return await DBQuery.get(`SELECT * FROM MenuItems WHERE id = ?`, [result.lastID]);
  }

  static async getStoreOrders(storeId) {
    const query = `SELECT * FROM Orders WHERE store_id = ? ORDER BY created_at DESC`;
    return await DBQuery.all(query, [storeId]);
  }

  static async getAllStores() {
    const query = `SELECT id, username, address, lat, lng FROM Users WHERE role = 'store' AND (is_open = 1 OR is_open IS NULL)`;
    return await DBQuery.all(query);
  }

  static async findStoreById(id) {
    const query = `SELECT id, username, address FROM Users WHERE role = 'store' AND id = ?`;
    return await DBQuery.get(query, [id]);
  }
}

module.exports = StoreModel;
