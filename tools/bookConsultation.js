const calendar =
require("../services/calendar");

async function bookConsultation({
  name,
  email,
  service,
  slot,
}) {

  const start =
    new Date(slot);

  const end =
    new Date(start);

  end.setMinutes(
    end.getMinutes() + 30
  );

  const event = {
    summary:
      `Consultation - ${name}`,

    description:
      `Email: ${email}
Service: ${service}`,

    extendedProperties: {
      private: {
        reminderSent:
          "false",
      },
    },

    start: {
      dateTime:
        start.toISOString(),

      timeZone:
        "Asia/Kolkata",
    },

    end: {
      dateTime:
        end.toISOString(),

      timeZone:
        "Asia/Kolkata",
    },

    conferenceData: {
      createRequest: {
        requestId:
          Date.now().toString(),
      },
    },
  };

  const response =
    await calendar.events.insert({
      calendarId:
        process.env
          .GOOGLE_CALENDAR_ID,

      resource: event,

      conferenceDataVersion: 1,
    });

  const meetLink =
    response.data
      .hangoutLink ||
    response.data
      ?.conferenceData
      ?.entryPoints
      ?.find(
        (e) =>
          e.entryPointType ===
          "video"
      )
      ?.uri;

  return {
    success: true,

    meetLink,

    eventId:
      response.data.id,
  };
}

module.exports =
  bookConsultation;