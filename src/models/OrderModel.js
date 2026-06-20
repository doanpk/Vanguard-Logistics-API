const { DBQuery } = require("../services/dbQuery");

class OrderModel {
  static async getAll() {
    return await DBQuery.all(`SELECT * FROM Orders ORDER BY created_at DESC`);
  }

  static async findById(id) {
    const query = `SELECT * FROM Orders WHERE id = ?`;
    return await DBQuery.get(query, [id]);
  }

  static async create(orderData) {
    let customerId = orderData.customerId || 1;
    let pickupAddress = orderData.pickupAddress || 'Unknown Pickup';
    let deliveryAddress = orderData.deliveryAddress || 'Unknown Delivery';
    let itemDescription = orderData.itemDescription || null;
    let lat = orderData.lat || null;
    let lng = orderData.lng || null;

    if (arguments.length > 1) {
      customerId = arguments[0];
      pickupAddress = arguments[1];
      deliveryAddress = arguments[2];
      itemDescription = arguments[3];
      lat = arguments[4] || null;
      lng = arguments[5] || null;
    }
    
    const query = `
      INSERT INTO Orders (customer_id, pickup_address, delivery_address, item_description, status, lat, lng)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `;
    const params = [customerId, pickupAddress, deliveryAddress, itemDescription, lat, lng];
    const result = await DBQuery.run(query, params);
    return await DBQuery.get(`SELECT * FROM Orders WHERE id = ?`, [result.lastID]);
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE Orders 
      SET status = ? 
      WHERE id = ?
    `;
    const result = await DBQuery.run(query, [status, id]);
    if (result.changes === 0) return null;
    return await DBQuery.get(`SELECT * FROM Orders WHERE id = ?`, [id]);
  }

  static async findByCustomerId(customerId) {
    const query = `SELECT * FROM Orders WHERE customer_id = ? ORDER BY created_at DESC`;
    return await DBQuery.all(query, [customerId]);
  }

  static async findByIdAndCustomerId(id, customerId) {
    const query = `SELECT * FROM Orders WHERE id = ? AND customer_id = ?`;
    return await DBQuery.get(query, [id, customerId]);
  }

  static async findPendingOrders() {
    const query = `SELECT * FROM Orders WHERE status = 'pending' AND driver_id IS NULL ORDER BY created_at DESC`;
    return await DBQuery.all(query);
  }

  // Bug 1 Fix: Atomic UPDATE to prevent race condition — single SQL statement
  static async acceptOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'accepted', driver_id = ? 
      WHERE id = ? AND status = 'pending' AND driver_id IS NULL
    `;
    const result = await DBQuery.run(query, [driverId, id]);
    if (result.changes === 0) return null;
    return await DBQuery.get(`SELECT * FROM Orders WHERE id = ?`, [id]);
  }

  // Bug 2 Fix: Atomic UPDATE ensures only the assigned driver can complete
  static async completeOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'completed' 
      WHERE id = ? AND driver_id = ? AND status = 'accepted'
    `;
    const result = await DBQuery.run(query, [id, driverId]);
    if (result.changes === 0) return null;
    return await DBQuery.get(`SELECT * FROM Orders WHERE id = ?`, [id]);
  }

  // Feature 1: Cancel order — atomic UPDATE with customer_id + status check
  static async cancelOrder(id, customerId) {
    const query = `
      UPDATE Orders 
      SET status = 'cancelled' 
      WHERE id = ? AND customer_id = ? AND status = 'pending'
    `;
    const result = await DBQuery.run(query, [id, customerId]);
    if (result.changes === 0) return null;
    return await DBQuery.get(`SELECT * FROM Orders WHERE id = ?`, [id]);
  }

  static async findByDriverId(driverId) {
    const query = `SELECT * FROM Orders WHERE driver_id = ? ORDER BY created_at DESC`;
    return await DBQuery.all(query, [driverId]);
  }
}

module.exports = OrderModel;
