/**
 * Order Status State Machine.
 * Enforces valid status transitions to prevent illegal state changes.
 */

const VALID_TRANSITIONS = {
  pending: ["accepted", "cancelled"],
  accepted: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Check if a status transition is allowed.
 * @param {string} currentStatus - The current status of the order.
 * @param {string} newStatus - The desired new status.
 * @returns {boolean} True if transition is valid.
 */
function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

module.exports = { canTransition, VALID_TRANSITIONS };
