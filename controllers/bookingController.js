const { createCalendarEvent } = require("../services/calendarService");
const { sendBookingEmail } = require("../services/email");

async function createBooking(req, res) {
  try {
    const { name, email, date, time } = req.body;

    const startTime = new Date(`${date} ${time}`);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    // 1. Create Google Meet event
    const { meetLink } = await createCalendarEvent({
      name,
      email,
      startTime,
      endTime,
    });

    // 2. Send email
    await sendBookingEmail({
      to: email,
      name,
      date,
      time,
      meetLink,
    });

    return res.json({
      success: true,
      meetLink,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Booking failed" });
  }
}

module.exports = { createBooking };