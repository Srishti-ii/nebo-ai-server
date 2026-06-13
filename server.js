require("dotenv").config();

const {
  sendBookingEmail
} = require("./services/email");
const express = require("express");
const bookingRoutes = require("./routes/bookingRoutes");
const generateSlots = require("./services/availability");
const calendar = require("./services/calendar");
const cron = require("./services/reminderService");
const app = express();
const cors = require("cors");
console.log(
  "Reminder Service Loaded"
);
console.log(
  "RESEND KEY EXISTS:",
  !!process.env.RESEND_API_KEY
);

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://neboengineering.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use("/api", bookingRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nebo Backend Running"
  });
});
app.post("/test-body", (req, res) => {
  console.log("TEST BODY:", req.body);

  res.json({
    success: true,
    body: req.body
  });
});
app.get("/events", async (req, res) => {
  try {
    const result = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(result.data.items);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});
app.get("/create-test-meeting", async (req, res) => {
  try {

    const start = new Date();
    start.setHours(start.getHours() + 1);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const event = {
      summary: "Nebo AI Test Meeting",

      start: {
        dateTime: start.toISOString(),
        timeZone: "Asia/Kolkata",
      },

      end: {
        dateTime: end.toISOString(),
        timeZone: "Asia/Kolkata",
      },

      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
        },
      },
    };

    const response = await calendar.events.insert({
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  resource: event,
  conferenceDataVersion: 1,

});

   console.log(JSON.stringify(response.data, null, 2));

res.json(response.data);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});
app.post("/book-meeting", async (req, res) => {
  console.log("HEADERS:", req.headers);
  console.log("BODY:", req.body);

  try {
    const { name, email, service, slot } = req.body;

    console.log(
      "CALENDAR ID:",
      process.env.GOOGLE_CALENDAR_ID
    );

    const start = new Date(slot);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const event = {
      summary: `Consultation - ${name}`,

      description: `
Email: ${email}
Service: ${service}
      `,

      extendedProperties: {
        private: {
          reminderSent: "false",
        },
      },

      start: {
        dateTime: start.toISOString(),
        timeZone: "Asia/Kolkata",
      },

      end: {
        dateTime: end.toISOString(),
        timeZone: "Asia/Kolkata",
      },

      conferenceData: {
        createRequest: {
          requestId: Date.now().toString(),
        },
      },
    };

    // FINAL AVAILABILITY CHECK

    const existingEvents =
      await calendar.events.list({
        calendarId:
          process.env.GOOGLE_CALENDAR_ID,

        timeMin: start.toISOString(),
        timeMax: end.toISOString(),

        singleEvents: true,
      });

    const conflict =
      existingEvents.data.items.some(
        (existingEvent) => {
          if (
            !existingEvent.start?.dateTime ||
            !existingEvent.end?.dateTime
          ) {
            return false;
          }

          const eventStart = new Date(
            existingEvent.start.dateTime
          );

          const eventEnd = new Date(
            existingEvent.end.dateTime
          );

          return (
            start < eventEnd &&
            end > eventStart
          );
        }
      );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message:
          "This slot has already been booked. Please choose another time.",
      });
    }

    console.log(
      "BOOKING EVENT:",
      JSON.stringify(event, null, 2)
    );

    const response =
      await calendar.events.insert({
        calendarId:
          process.env.GOOGLE_CALENDAR_ID,

        resource: event,

        conferenceDataVersion: 1,
      });

    console.log(
      "GOOGLE RESPONSE:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    console.log(
      "CONFERENCE DATA:",
      JSON.stringify(
        response.data.conferenceData,
        null,
        2
      )
    );

    console.log(
      "HANGOUT LINK:",
      response.data.hangoutLink
    );

    const meetLink =
      response.data.hangoutLink ||
      response.data
        ?.conferenceData
        ?.entryPoints
        ?.find(
          (entry) =>
            entry.entryPointType ===
            "video"
        )
        ?.uri;

    console.log(
      "FINAL MEET LINK:",
      meetLink
    );

    const emailResult =
      await sendBookingEmail({
        name,
        email,
        slot,
        meetLink,
      });

    console.log(
      "EMAIL RESULT:",
      emailResult
    );

    res.json({
      success: true,

      eventId: response.data.id,

      meetLink,

      calendarLink:
        response.data.htmlLink,

      emailSent:
        emailResult?.success || false,

      emailError:
        emailResult?.error?.message ||
        null,
    });
  } catch (error) {
    console.error(
      "BOOKING ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/available-slots", async (req, res) => {
  try {

    const now = new Date();

    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    const result = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const slots = generateSlots(result.data.items);

    const formattedSlots = slots.map(slot => ({
  value: slot.toISOString(),
  label: slot.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }),
}));
console.log("Generated slots:", formattedSlots);
    res.json(formattedSlots);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});