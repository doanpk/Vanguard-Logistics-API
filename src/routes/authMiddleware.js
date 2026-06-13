const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Access denied. No token provided.",
      data: null,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id and role
    next();
  } catch (error) {
    res
      .status(401)
      .json({ status: "error", message: "Invalid token.", data: null });
  }
};

const requireRole = (roleName) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleName) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Insufficient permissions.",
        data: null,
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
