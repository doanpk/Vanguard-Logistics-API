/**
 * Order Status State Machine.
 * Enforces valid status transitions to prevent illegal state changes.
 */

const orderStates = {
  pending: ["finding_driver", "cancelled"],           // Quán nhận -> finding_driver, Khách hủy -> cancelled
  finding_driver: ["preparing"],                       // Tx nhận -> preparing
  preparing: ["delivering"],                           // Tx lấy hàng -> delivering
  delivering: ["arrived"],                             // Tx đến điểm giao -> arrived
  arrived: ["completed"],                              // Tx giao xong -> completed (KHÔNG cho hủy)
  completed: [],
  cancelled: [],
};

/**
 * Check if a status transition is allowed.
 * @param {string} currentStatus - The current status of the order.
 * @param {string} nextStatus - The desired new status.
 * @returns {boolean} True if transition is valid.
 */
function canTransition(currentStatus, nextStatus) {
  const allowedNextStates = orderStates[currentStatus];
  if (!allowedNextStates) return false;
  return allowedNextStates.includes(nextStatus);
}

module.exports = {
  orderStates,
  canTransition,
};
