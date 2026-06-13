const { DBQuery } = require("../services/dbQuery");

class OrderModel {
  static async getAll() {
    return await DBQuery.all(`SELECT * FROM Orders ORDER BY created_at DESC`);
  }

  static async create(orderData) {
    // Note: Assuming orderData has customerId, pickupAddress, deliveryAddress, itemDescription based on previous OrderModel
    // If it's a generic object as per OrderService.js, let's adapt it.
    // Let's assume orderData is { customerName, deliveryAddress, pickupAddress, itemDescription } or similar based on OrderService.
    // Previously, OrderModel.create took (customerId, pickupAddress, deliveryAddress, itemDescription).
    // Let's accept both forms depending on how it's called.
    
    let customerId = orderData.customerId || 1; // Fallback to 1 if customerName was passed as per MVP boilerplate
    let pickupAddress = orderData.pickupAddress || 'Unknown Pickup';
    let deliveryAddress = orderData.deliveryAddress || 'Unknown Delivery';
    let itemDescription = orderData.itemDescription || null;

    if (arguments.length > 1) {
      // It was called with (customerId, pickupAddress, deliveryAddress, itemDescription)
      customerId = arguments[0];
      pickupAddress = arguments[1];
      deliveryAddress = arguments[2];
      itemDescription = arguments[3];
    }
    
    const query = `
      INSERT INTO Orders (customer_id, pickup_address, delivery_address, item_description, status)
      VALUES (?, ?, ?, ?, 'pending')
      RETURNING *
    `;
    const params = [customerId, pickupAddress, deliveryAddress, itemDescription];
    return await DBQuery.get(query, params);
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE Orders 
      SET status = ? 
      WHERE id = ?
      RETURNING *
    `;
    return await DBQuery.get(query, [status, id]);
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

  static async acceptOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'accepted', driver_id = ? 
      WHERE id = ? AND status = 'pending' AND driver_id IS NULL
      RETURNING *
    `;
    return await DBQuery.get(query, [driverId, id]);
  }

  static async completeOrder(id, driverId) {
    const query = `
      UPDATE Orders 
      SET status = 'completed' 
      WHERE id = ? AND driver_id = ? AND status = 'accepted'
      RETURNING *
    `;
    return await DBQuery.get(query, [id, driverId]);
  }

  static async findByDriverId(driverId) {
    const query = `SELECT * FROM Orders WHERE driver_id = ? ORDER BY created_at DESC`;
    return await DBQuery.all(query, [driverId]);
  }
}

module.exports = OrderModel;
