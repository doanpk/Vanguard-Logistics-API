const UserService = require("../services/UserService");
const UserModel = require("../models/UserModel");
const { success } = require("../utils/responseHelper");

class UsersController {
  static async getProfile(req, res, next) {
    try {
      const profile = await UserService.getProfile(req.user.id);
      return success(res, profile, "Profile retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async deposit(req, res, next) {
    try {
      const { amount } = req.body;
      const profile = await UserService.depositWallet(req.user.id, Number(amount));
      return success(res, profile, "Wallet deposited successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.getAllUsers();
      return success(res, users, "Users retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async lockUser(req, res, next) {
    try {
      const user = await UserModel.lockUser(req.params.id);
      return success(res, user, "User locked successfully");
    } catch (err) {
      next(err);
    }
  }

  static async unlockUser(req, res, next) {
    try {
      const user = await UserModel.unlockUser(req.params.id);
      return success(res, user, "User unlocked successfully");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UsersController;
