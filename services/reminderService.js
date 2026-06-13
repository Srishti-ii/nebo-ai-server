const {
  sendReminderEmail
} = require("./email");

const calendar = require("./calendar");

const cron = require("node-cron");

cron.schedule("*/15 * * * *", async () => {
  try {
    console.log("Checking reminders...");

    const now = new Date();

    const upcomingEvents =
      await calendar.events.list({
        calendarId:
          process.env.GOOGLE_CALENDAR_ID,

        timeMin: now.toISOString(),

        timeMax: new Date(
          now.getTime() +
          2 * 60 * 60 * 1000
        ).toISOString(),

        singleEvents: true,
        orderBy: "startTime",
      });

    for (
      const event of upcomingEvents.data.items
    ) {

      if (
        !event.start?.dateTime
      ) {
        continue;
      }

      const startTime =
        new Date(
          event.start.dateTime
        );

      const diffMinutes =
        (
          startTime - now
        ) / 60000;

      const reminderSent =
        event.extendedProperties
          ?.private
          ?.reminderSent === "true";

      if (
        reminderSent
      ) {
        continue;
      }

      if (
        diffMinutes >= 55 &&
        diffMinutes <= 65
      ) {

        const userEmail =
          event.attendees?.[0]?.email;

        const userName =
          event.summary?.split(" - ")[1] ||
          "Customer";

        if (!userEmail) {
          continue;
        }

     const meetLink =
  event.hangoutLink ||
  event.conferenceData
    ?.entryPoints
    ?.find(
      entry =>
        entry.entryPointType === "video"
    )
    ?.uri;

const reminderResult =
  await sendReminderEmail({
    name: userName,
    email: userEmail,
    slot: event.start.dateTime,
    meetLink,
  });

console.log(
  "REMINDER RESULT:",
  reminderResult
);

if (
  reminderResult.success
) {

  await calendar.events.patch({
    calendarId:
      process.env.GOOGLE_CALENDAR_ID,

    eventId: event.id,

    resource: {
      extendedProperties: {
        private: {
          reminderSent:
            "true"
        }
      }
    }
  });

  console.log(
    `Reminder marked sent: ${event.id}`
  );

}
        console.log(
          `Reminder sent: ${event.id}`
        );
      }
    }

  } catch (error) {
    console.error(
      "Reminder error:",
      error
    );
  }
});