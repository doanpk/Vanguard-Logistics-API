const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

class AuthService {
  static async register(username, password, role) {
    if (!username || !password || !role) {
      throw new Error("Username, password, and role are required.");
    }

    if (!["customer", "driver"].includes(role)) {
      throw new Error("Role must be 'customer' or 'driver'.");
    }

    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      throw new Error("Username already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return await UserModel.create(username, passwordHash, role);
  }

  static async login(username, password) {
    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error("Invalid username or password.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid username or password.");
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
