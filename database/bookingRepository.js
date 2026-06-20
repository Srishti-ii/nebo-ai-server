const db = require("../config/database");


async function saveBooking({
  sessionId,
  leadId,
  name,
  email,
  service,
  slot,
  meetLink,
  eventId
}) {

  const result = await db.query(
    `
    INSERT INTO bookings
    (session_id, lead_id, name, email, service, slot, meet_link, event_id, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [sessionId, leadId, name, email, service, slot, meetLink, eventId, "confirmed"]
  );

  return result.rows[0];
}


async function getBookingBySession(sessionId) {
  const result = await db.query(
    `SELECT * FROM bookings WHERE session_id = $1 AND status != 'cancelled' ORDER BY created_at DESC LIMIT 1`,
    [sessionId]
  );
  return result.rows[0] || null;
}


async function updateBookingSlot({ sessionId, newSlot, meetLink, eventId }) {
  const result = await db.query(
    `
    UPDATE bookings
    SET slot = $2, meet_link = $3, event_id = $4, reschedule_count = COALESCE(reschedule_count, 0) + 1
    WHERE session_id = $1 AND status = 'confirmed'
    RETURNING *
    `,
    [sessionId, newSlot, meetLink, eventId]
  );
  return result.rows[0];
}


async function cancelBooking(sessionId) {
  const result = await db.query(
    `
    UPDATE bookings
    SET status = 'cancelled'
    WHERE session_id = $1 AND status = 'confirmed'
    RETURNING *
    `,
    [sessionId]
  );
  return result.rows[0];
}


module.exports = {
  saveBooking,
  getBookingBySession,
  updateBookingSlot,
  cancelBooking
};