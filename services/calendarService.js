const calendar = require("./calendar");

async function createCalendarEvent({ name, email, startTime, endTime }) {
  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Meeting with ${name}`,
      description: "Auto generated booking",
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      attendees: [{ email }],
      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
  });

  const meetLink =
    event.data.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri;

  return {
    eventId: event.data.id,
    meetLink,
  };
}

module.exports = { createCalendarEvent };