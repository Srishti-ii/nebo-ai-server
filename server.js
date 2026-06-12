
const express = require("express");
const generateSlots = require("./services/availability");
const calendar = require("./services/calendar");
const app = express();
const cors = require("cors");

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
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
      conferenceDataVersion: 1,
      resource: event,
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

const start = new Date(slot);

const end = new Date(start);
end.setMinutes(end.getMinutes() + 30);

   const event = {
  summary: `Consultation - ${name}`,

  description: `
Email: ${email}
Service: ${service}
  `,

  start: {
    dateTime: start.toISOString(),
    timeZone: "Asia/Kolkata",
  },

  end: {
    dateTime: end.toISOString(),
    timeZone: "Asia/Kolkata",
  },
};

// FINAL AVAILABILITY CHECK
const existingEvents = await calendar.events.list({
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  timeMin: start.toISOString(),
  timeMax: end.toISOString(),
  singleEvents: true,
});

const conflict = existingEvents.data.items.some(existingEvent => {
  if (
    !existingEvent.start?.dateTime ||
    !existingEvent.end?.dateTime
  ) {
    return false;
  }

  const eventStart = new Date(existingEvent.start.dateTime);
  const eventEnd = new Date(existingEvent.end.dateTime);

  return (
    start < eventEnd &&
    end > eventStart
  );
});

if (conflict) {
  return res.status(409).json({
    success: false,
    message: "This slot has already been booked. Please choose another time.",
  });
}
const response = await calendar.events.insert({
  calendarId: process.env.GOOGLE_CALENDAR_ID,
  resource: event,
});

    res.json({
      success: true,
      eventId: response.data.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
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
// app.post("/chat", async (req, res) => {
//   try {
//     const { message } = req.body;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         {
//           role: "system",
//           content: `
// You are Nebo IT Solutions AI assistant.

// Services:
// - AI Automation
// - Website Development
// - Mobile Apps
// - CRM Solutions

// If user wants a meeting,
// tell them you can help schedule one.
// `
//         },
//         {
//           role: "user",
//           content: message
//         }
//       ]
//     });

//     res.json({
//       reply: completion.choices[0].message.content
//     });

//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// });
const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});