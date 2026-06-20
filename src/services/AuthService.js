const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

class AuthService {
  // Bug 5 Fix: Role validation already present, now with proper err.status
  static async register(username, password, role, address = null, phone_number = null, vehicle_info = null, full_name = null) {
    if (!username || !password || !role) {
      const err = new Error("Username, password, and role are required.");
      err.status = 400;
      throw err;
    }

    // Validate role is strictly 'customer', 'driver', 'manager', or 'store'
    if (!["customer", "driver", "manager", "store"].includes(role)) {
      const err = new Error("Role must be 'customer', 'driver', 'manager', or 'store'.");
      err.status = 400;
      throw err;
    }

    if (role === "store" && !address) {
      const err = new Error("Address is required for store registration.");
      err.status = 400;
      throw err;
    }

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      const err = new Error("Username already exists.");
      err.status = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create(username, hashedPassword, role, address, phone_number, vehicle_info, full_name);
    return newUser;
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
