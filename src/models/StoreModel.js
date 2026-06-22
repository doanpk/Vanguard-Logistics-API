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
    const query = `
      SELECT Orders.*, 
             CustomerUser.full_name AS customer_name, CustomerUser.phone_number AS customer_phone,
             DriverUser.full_name AS driver_name, DriverUser.phone_number AS driver_phone, DriverUser.vehicle_info AS driver_vehicle
      FROM Orders 
      LEFT JOIN Users AS CustomerUser ON Orders.customer_id = CustomerUser.id
      LEFT JOIN Users AS DriverUser ON Orders.driver_id = DriverUser.id
      WHERE Orders.store_id = ? 
      ORDER BY Orders.created_at DESC
    `;
    return await DBQuery.all(query, [storeId]);
  }

  static async getAllStores() {
    const query = `
      SELECT u.id, u.username, u.address, u.lat, u.lng, u.is_open, u.category,
             GROUP_CONCAT(m.name, ', ') AS menu_items
      FROM Users u
      LEFT JOIN MenuItems m ON u.id = m.store_id
      WHERE u.role = 'store' AND (u.is_open IS NULL OR u.is_open = 1)
      GROUP BY u.id
    `;
    return await DBQuery.all(query);
  }

  static async findStoreById(id) {
    const query = `SELECT id, username, address FROM Users WHERE role = 'store' AND id = ?`;
    return await DBQuery.get(query, [id]);
  }
}

module.exports = StoreModel;
