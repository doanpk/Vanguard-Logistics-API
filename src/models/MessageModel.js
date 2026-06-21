const { DBQuery } = require("../services/dbQuery");

class MessageModel {
  static async getMessagesByOrderId(orderId) {
    const query = `
      SELECT m.*, u.username as sender_name 
      FROM OrderMessages m
      JOIN Users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC
    `;
    return await DBQuery.all(query, [orderId]);
  }

  static async addMessage(orderId, senderId, senderRole, content) {
    const query = `
      INSERT INTO OrderMessages (order_id, sender_id, sender_role, content)
      VALUES (?, ?, ?, ?)
    `;
    const result = await DBQuery.run(query, [orderId, senderId, senderRole, content]);
    
    // Return the newly created message with sender name
    const fetchQuery = `
      SELECT m.*, u.username as sender_name 
      FROM OrderMessages m
      JOIN Users u ON m.sender_id = u.id
      WHERE m.id = ?
    `;
    return await DBQuery.get(fetchQuery, [result.lastID]);
  }
}

module.exports = MessageModel;
