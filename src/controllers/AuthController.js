const AuthService = require("../services/AuthService");

class AuthController {
  static async register(req, res) {
    try {
      const { username, password, role } = req.body;
      const newUser = await AuthService.register(username, password, role);
      res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: newUser,
      });
    } catch (error) {
      res
        .status(400)
        .json({ status: "error", message: error.message, data: null });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const authData = await AuthService.login(username, password);
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: authData,
      });
    } catch (error) {
      res
        .status(401)
        .json({ status: "error", message: error.message, data: null });
    }
  }
}

module.exports = AuthController;
