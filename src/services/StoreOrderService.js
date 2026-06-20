const StoreModel = require("../models/StoreModel");

class StoreOrderService {
  static async getMenu(storeId) {
    return await StoreModel.getMenuItems(storeId);
  }

  static async addMenuItem(storeId, data) {
    const { name, price, description } = data;
    if (!name || price === undefined) {
      const err = new Error("Name and price are required for menu item.");
      err.status = 400;
      throw err;
    }
    return await StoreModel.addMenuItem(storeId, name, price, description);
  }

  static async getStoreOrders(storeId) {
    return await StoreModel.getStoreOrders(storeId);
  }

  static async acceptOrder(orderId, storeId) {
    const OrderModel = require("../models/OrderModel");
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }
    
    if (order.store_id !== storeId) {
      const err = new Error("This order does not belong to your store");
      err.status = 403;
      throw err;
    }

    const { canTransition } = require("../utils/orderStateMachine");
    if (!canTransition(order.status, "finding_driver")) {
      const err = new Error(`Cannot accept order. Current status: ${order.status}`);
      err.status = 400;
      throw err;
    }

    const acceptedOrder = await OrderModel.storeAcceptOrder(orderId, storeId);
    if (!acceptedOrder) {
      const err = new Error("Order was updated by someone else");
      err.status = 409;
      throw err;
    }
    return acceptedOrder;
  }

  static async rejectOrder(orderId, storeId) {
    const OrderModel = require("../models/OrderModel");
    const order = await OrderModel.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.status = 404;
      throw err;
    }

    if (order.store_id !== storeId) {
      const err = new Error("This order does not belong to your store");
      err.status = 403;
      throw err;
    }

    const { canTransition } = require("../utils/orderStateMachine");
    if (!canTransition(order.status, "cancelled")) {
      const err = new Error(`Cannot reject order. Current status: ${order.status}`);
      err.status = 400;
      throw err;
    }

    const rejectedOrder = await OrderModel.storeRejectOrder(orderId, storeId, order.status);
    if (!rejectedOrder) {
      const err = new Error("Order was updated by someone else");
      err.status = 409;
      throw err;
    }

    // Hoàn tiền cho khách
    const totalCost = (order.total_price || 0) + (order.delivery_fee || 0);
    if (totalCost > 0 && order.customer_id) {
      const UserModel = require("../models/UserModel");
      await UserModel.updateBalance(order.customer_id, totalCost);
    }

    return rejectedOrder;
  }

  static async getAllStores() {
    return await StoreModel.getAllStores();
  }

  static async getStoreMenuForCustomer(storeId) {
    const store = await StoreModel.findStoreById(storeId);
    if (!store) {
      const err = new Error("Store not found");
      err.status = 404;
      throw err;
    }
    const menu = await StoreModel.getMenuItems(storeId);
    return { store, menu };
  }
}

module.exports = StoreOrderService;
