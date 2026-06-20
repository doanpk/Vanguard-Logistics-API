const AuthService = require("../services/AuthService");
const { success, error } = require("../utils/responseHelper");

class AuthController {
  // Feature 2: Input validation for register
  static async register(req, res, next) {
    try {
      const { username, password, role } = req.body;

      // Feature 2: Detailed input validation
      const errors = [];
      if (!username || username.trim().length < 3) {
        errors.push("Username must be at least 3 characters.");
      }
      if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters.");
      }
      if (!role || !["customer", "driver"].includes(role)) {
        errors.push("Role must be 'customer' or 'driver'.");
      }
      if (errors.length > 0) {
        return error(res, errors.join(" "), 400);
      }

      const newUser = await AuthService.register(username.trim(), password, role);
      return success(res, newUser, "User registered successfully", 201);
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
