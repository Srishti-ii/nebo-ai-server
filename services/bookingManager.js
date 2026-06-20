const calendar = require("./calendar");
const { getBookingBySession, updateBookingSlot, cancelBooking: cancelBookingDB } = require("../database/bookingRepository");
const { sendRescheduleEmail, sendCancellationEmail } = require("./email");


async function canReschedule(sessionId) {
  const booking = await getBookingBySession(sessionId);
  if (!booking) return { allowed: false, reason: "no_booking" };
  if ((booking.reschedule_count || 0) >= 1) return { allowed: false, reason: "limit_reached" };

  // Check if meeting is within 2 hours
  const meetingTime = new Date(booking.slot).getTime();
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;
  if (meetingTime - now < twoHours) return { allowed: false, reason: "too_soon" };

  return { allowed: true, booking };
}


async function rescheduleBooking({ sessionId, newSlot, name }) {
  const { allowed, reason, booking } = await canReschedule(sessionId);
  if (!allowed) return { success: false, reason };

  const oldSlot = booking.slot;
  const oldEventId = booking.event_id;

  // Delete old calendar event
  try {
    if (oldEventId) {
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: oldEventId
      });
    }
  } catch (err) {
    console.error("Failed to delete old calendar event:", err.message);
  }

  // Create new calendar event
  const start = new Date(newSlot.replace("Z", "+05:30"));
  if (isNaN(start.getTime())) {
    return { success: false, reason: "invalid_slot" };
  }

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  const event = {
    summary: `Consultation - ${name || booking.name || "Website Visitor"}`,
    description: `Email: ${booking.email}\nService: ${booking.service}\nRescheduled`,
    start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
    end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
    conferenceData: {
      createRequest: {
        requestId: "meet-resched-" + Date.now(),
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: "all"
  });

  const meetLink = response.data.hangoutLink ||
    response.data?.conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri;

  // Update DB
  await updateBookingSlot({
    sessionId,
    newSlot,
    meetLink,
    eventId: response.data.id
  });

  // Send email
  await sendRescheduleEmail({
    name: name || booking.name || "Website Visitor",
    email: booking.email,
    oldSlot,
    newSlot,
    meetLink
  });

  return {
    success: true,
    meetLink,
    eventId: response.data.id,
    oldSlot,
    newSlot
  };
}


async function cancelBookingFlow(sessionId) {
  const booking = await getBookingBySession(sessionId);
  if (!booking) return { success: false, reason: "no_booking" };

  // Delete calendar event
  try {
    if (booking.event_id) {
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        eventId: booking.event_id
      });
    }
  } catch (err) {
    console.error("Failed to delete calendar event:", err.message);
  }

  // Update DB
  await cancelBookingDB(sessionId);

  // Send email
  await sendCancellationEmail({
    name: booking.name || "Website Visitor",
    email: booking.email,
    slot: booking.slot
  });

  return { success: true };
}


module.exports = {
  canReschedule,
  rescheduleBooking,
  cancelBookingFlow
};
