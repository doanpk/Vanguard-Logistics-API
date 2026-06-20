const StoreOrderService = require("../services/StoreOrderService");
const { success } = require("../utils/responseHelper");

class StoreOrderController {
  static async getMenu(req, res, next) {
    try {
      const storeId = req.user.id;
      const menu = await StoreOrderService.getMenu(storeId);
      return success(res, menu, "Menu retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async addMenuItem(req, res, next) {
    try {
      const storeId = req.user.id;
      const item = await StoreOrderService.addMenuItem(storeId, req.body);
      return success(res, item, "Menu item added successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const storeId = req.user.id;
      const orders = await StoreOrderService.getStoreOrders(storeId);
      return success(res, orders, "Store orders retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async acceptOrder(req, res, next) {
    try {
      const storeId = req.user.id;
      const orderId = req.params.id;
      const acceptedOrder = await StoreOrderService.acceptOrder(orderId, storeId);
      return success(res, acceptedOrder, "Order accepted and is preparing");
    } catch (err) {
      next(err);
    }
  }

  static async rejectOrder(req, res, next) {
    try {
      const storeId = req.user.id;
      const orderId = req.params.id;
      const rejectedOrder = await StoreOrderService.rejectOrder(orderId, storeId);
      return success(res, rejectedOrder, "Order rejected and refunded");
    } catch (err) {
      next(err);
    }
  }

  static async toggleStatus(req, res, next) {
    try {
      const storeId = req.user.id;
      const { is_open } = req.body;
      const UserModel = require("../models/UserModel");
      await UserModel.updateField(storeId, 'is_open', is_open ? 1 : 0);
      return success(res, { is_open }, "Store status updated");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StoreOrderController;
