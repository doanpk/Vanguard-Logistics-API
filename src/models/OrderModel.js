const { DBQuery } = require("../services/dbQuery");

class OrderModel {
  static async getAll() {
    return await DBQuery.all(`
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      ORDER BY Orders.created_at DESC
    `);
  }

  static async findById(id) {
    const query = `
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      WHERE Orders.id = ?
    `;
    return await DBQuery.get(query, [id]);
  }

  static async create(customerId, storeId, pickupAddress, deliveryAddress, itemDescription, totalPrice, deliveryFee, lat, lng) {
    const query = `
      INSERT INTO Orders (customer_id, store_id, pickup_address, delivery_address, item_description, status, total_price, delivery_fee, lat, lng)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `;
    const params = [customerId, storeId, pickupAddress, deliveryAddress, itemDescription, totalPrice, deliveryFee, lat, lng];
    const result = await DBQuery.run(query, params);
    return await this.findById(result.lastID);
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE Orders 
      SET status = ? 
      WHERE id = ?
    `;
    const result = await DBQuery.run(query, [status, id]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  static async findByCustomerId(customerId) {
    const query = `
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      WHERE Orders.customer_id = ? 
      ORDER BY Orders.created_at DESC
    `;
    return await DBQuery.all(query, [customerId]);
  }

  static async findByIdAndCustomerId(id, customerId) {
    const query = `
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      WHERE Orders.id = ? AND Orders.customer_id = ?
    `;
    return await DBQuery.get(query, [id, customerId]);
  }

  static async findPendingOrders() {
    const query = `
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      WHERE Orders.status = 'finding_driver' AND Orders.driver_id IS NULL 
      ORDER BY Orders.created_at DESC
    `;
    return await DBQuery.all(query);
  }

  static async storeAcceptOrder(id, storeId) {
    const query = `
      UPDATE Orders 
      SET status = 'finding_driver' 
      WHERE id = ? AND store_id = ? AND status = 'pending'
    `;
    const result = await DBQuery.run(query, [id, storeId]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  // Bug 1 Fix: Atomic UPDATE to prevent race condition — single SQL statement
  static async acceptOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'preparing', driver_id = ? 
      WHERE id = ? AND status = 'finding_driver' AND driver_id IS NULL
    `;
    const result = await DBQuery.run(query, [driverId, id]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  static async pickupOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'delivering' 
      WHERE id = ? AND driver_id = ? AND status = 'preparing'
    `;
    const result = await DBQuery.run(query, [id, driverId]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  // Bug 2 Fix: Atomic UPDATE ensures only the assigned driver can complete
  static async completeOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'completed' 
      WHERE id = ? AND driver_id = ? AND status = 'delivering'
    `;
    const result = await DBQuery.run(query, [id, driverId]);
    if (result.changes === 0) return null;
    return await this.findById(id);
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
    return await this.findById(id);
  }

  // Expanded cancel: works for pending, finding_driver, preparing
  static async cancelOrderExpanded(id, customerId, currentStatus) {
    const query = `
      UPDATE Orders 
      SET status = 'cancelled' 
      WHERE id = ? AND customer_id = ? AND status = ?
    `;
    const result = await DBQuery.run(query, [id, customerId, currentStatus]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  // Store rejects order (any status before delivering)
  static async storeRejectOrder(id, storeId, currentStatus) {
    const query = `
      UPDATE Orders 
      SET status = 'cancelled' 
      WHERE id = ? AND store_id = ? AND status = ?
    `;
    const result = await DBQuery.run(query, [id, storeId, currentStatus]);
    if (result.changes === 0) return null;
    return await this.findById(id);
  }

  static async findByDriverId(driverId) {
    const query = `
      SELECT Orders.*, Users.lat AS store_lat, Users.lng AS store_lng 
      FROM Orders 
      LEFT JOIN Users ON Orders.store_id = Users.id 
      WHERE Orders.driver_id = ? 
      ORDER BY Orders.created_at DESC
    `;
    return await DBQuery.all(query, [driverId]);
  }
}

module.exports = OrderModel;
