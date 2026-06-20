const UserModel = require("../models/UserModel");

class UserService {
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    // Không trả về password_hash
    const { password_hash, ...profile } = user;
    return profile;
  }

  static async depositWallet(userId, amount) {
    if (amount <= 0) {
      const err = new Error("Deposit amount must be positive");
      err.status = 400;
      throw err;
    }
    const updatedUser = await UserModel.updateBalance(userId, amount);
    const { password_hash, ...profile } = updatedUser;
    return profile;
  }
}

module.exports = UserService;
