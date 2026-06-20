/**
 * Unified response format helper.
 * All API responses use: { success: boolean, message: string, data: object|null }
 */

const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = "Internal Server Error", statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message, data: null });
};

module.exports = { success, error };
