const calendar =
require("../services/calendar");

const generateSlots =
require("../services/availability");

async function getAvailableSlots() {

  const now = new Date();

  const nextWeek = new Date();

  nextWeek.setDate(
    now.getDate() + 7
  );

  const result =
    await calendar.events.list({
      calendarId:
        process.env.GOOGLE_CALENDAR_ID,

      timeMin:
        now.toISOString(),

      timeMax:
        nextWeek.toISOString(),

      singleEvents: true,

      orderBy: "startTime",
    });

  const slots =
    generateSlots(
      result.data.items
    );

  return slots
    .slice(0, 10)
    .map((slot) => ({
      value:
        slot.toISOString(),

      label:
slot.toLocaleString(
"en-IN",
{
timeZone:"Asia/Kolkata",
dateStyle:"medium",
timeStyle:"short",
}
),
    }));
}

module.exports =
  getAvailableSlots;