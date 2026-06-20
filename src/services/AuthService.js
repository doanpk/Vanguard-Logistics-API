const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

class AuthService {
  // Bug 5 Fix: Role validation already present, now with proper err.status
  static async register(username, password, role) {
    if (!username || !password || !role) {
      const err = new Error("Username, password, and role are required.");
      err.status = 400;
      throw err;
    }

    // Bug 5: Validate role is strictly 'customer' or 'driver'
    if (!["customer", "driver"].includes(role)) {
      const err = new Error("Role must be 'customer' or 'driver'.");
      err.status = 400;
      throw err;
    }

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      const err = new Error("Username already exists.");
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return await UserModel.create(username, passwordHash, role);
  }

  static async login(username, password) {
    if (!username || !password) {
      const err = new Error("Username and password are required.");
      err.status = 400;
      throw err;
    }

    const user = await UserModel.findByUsername(username);
    if (!user) {
      const err = new Error("Invalid username or password.");
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error("Invalid username or password.");
      err.status = 401;
      throw err;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return {
      user: { id: user.id, username: user.username, role: user.role },
      token,
    };
  }
}

module.exports = AuthService;
