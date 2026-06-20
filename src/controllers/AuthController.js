const AuthService = require("../services/AuthService");
const { success, error } = require("../utils/responseHelper");

class AuthController {
  // Feature 2: Input validation for register
  static async register(req, res, next) {
    try {
      const { username, password, role, address, phone_number, vehicle_info, full_name } = req.body;

      const errors = [];
      if (!username || username.length < 3) {
        errors.push("Username must be at least 3 characters.");
      }
      if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters.");
      }
      if (!role || !["customer", "driver", "manager", "store"].includes(role)) {
        errors.push("Role must be 'customer', 'driver', 'manager', or 'store'.");
      }
      if (role === "store" && (!address || address.length < 5)) {
        errors.push("Address is required for stores and must be valid.");
      }

      if (errors.length > 0) {
        return error(res, errors.join(" "), 400);
      }

      const newUser = await AuthService.register(username, password, role, address, phone_number, vehicle_info, full_name);
      return success(res, { user: newUser }, "User registered successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  // Feature 2: Input validation for login
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Feature 2: Validate required fields
      const errors = [];
      if (!username || username.trim().length === 0) {
        errors.push("Username is required.");
      }
      if (!password || password.length === 0) {
        errors.push("Password is required.");
      }
      if (errors.length > 0) {
        return error(res, errors.join(" "), 400);
      }

      const authData = await AuthService.login(username.trim(), password);
      return success(res, authData, "Login successful");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
