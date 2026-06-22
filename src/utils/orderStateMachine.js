/**
 * Order Status State Machine.
 * Enforces valid status transitions to prevent illegal state changes.
 */

const orderStates = {
  pending: ["finding_driver", "cancelled"],           // Quán nhận -> finding_driver, Khách hủy -> cancelled
  finding_driver: ["preparing"],                       // Tx nhận -> preparing
  preparing: ["arrived_store"],                        // Tx đến quán -> arrived_store
  arrived_store: ["delivering"],                       // Tx lấy hàng -> delivering
  delivering: ["arrived", "failed"],                   // Tx đến điểm giao -> arrived, hoặc Khách bom -> failed
  arrived: ["completed", "failed"],                    // Tx giao xong -> completed, hoặc Khách bom -> failed
  completed: [],
  cancelled: [],
  failed: [],                                          // Đơn bom hàng -> failed
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
