const OrderService = require("../services/OrderService");
const { success } = require("../utils/responseHelper");

class OrderController {
  static async getOrders(req, res, next) {
    try {
      const orders = await OrderService.getAllOrders();
      return success(res, orders, "Orders retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getDashboard(req, res, next) {
    try {
      const dashboard = await OrderService.getDashboard();
      return success(res, dashboard, "Dashboard stats retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const newOrder = await OrderService.createOrder(req.body);
      return success(res, newOrder, "Order created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedOrder = await OrderService.updateOrderStatus(id, status);
      return success(res, updatedOrder, "Order status updated successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = OrderController;
