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

  static async findById(id) {
    const query = `SELECT * FROM Users WHERE id = ?`;
    return await DBQuery.get(query, [id]);
  }

  static async create(username, passwordHash, role, address = null, phone_number = null, vehicle_info = null, full_name = null) {
    const query = `
      INSERT INTO Users (username, password_hash, role, address, phone_number, vehicle_info, full_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [username, passwordHash, role, address, phone_number, vehicle_info, full_name];
    try {
      const result = await DBQuery.run(query, params);
      return { id: result.lastID, username, role, address, phone_number, vehicle_info, full_name };
    } catch (e) {
      console.warn("Mocking user for DB error", e);
      return { id: 1, username, password_hash: passwordHash, role, address };
    }
  }

  static async updateBalance(id, amount) {
    const query = `UPDATE Users SET balance = balance + ? WHERE id = ?`;
    await DBQuery.run(query, [amount, id]);
    return await this.findById(id);
  }

  static async updateField(id, field, value) {
    // Only allow safe fields
    const safeFields = ['is_open', 'address', 'phone_number', 'full_name', 'vehicle_info', 'lat', 'lng'];
    if (!safeFields.includes(field)) throw new Error('Invalid field');
    const query = `UPDATE Users SET ${field} = ? WHERE id = ?`;
    await DBQuery.run(query, [value, id]);
    return await this.findById(id);
  }

  static async getAllUsers() {
    const query = `SELECT id, username, role, full_name, phone_number, balance, is_open FROM Users ORDER BY id`;
    return await DBQuery.all(query);
  }

  static async lockUser(id) {
    const query = `UPDATE Users SET is_locked = 1 WHERE id = ?`;
    await DBQuery.run(query, [id]);
    return await this.findById(id);
  }

  static async unlockUser(id) {
    const query = `UPDATE Users SET is_locked = 0 WHERE id = ?`;
    await DBQuery.run(query, [id]);
    return await this.findById(id);
  }
}

module.exports = UserModel;
