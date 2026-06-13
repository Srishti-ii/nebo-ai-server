const planner = require("./planner");

const runTool =
  require("./toolRouter");

const salesAgent =
  require("./salesAgent");

const isSlotSelected =
  require("../tools/isSlotSelected");

async function agentExecutor(
  session,
  userMessage
) {
  const plan =
    await planner(
      session,
      userMessage
    );

  console.log(
    "PLAN:",
    plan
  );


  if (
    session.state ===
      "SHOW_SLOTS" &&
    isSlotSelected(
      userMessage
    )
  ) {
    session.booking.slot =
      userMessage;

    session.state =
      "COLLECT_EMAIL";

    return {
      type: "text",

      response:
        "Perfect. What email should I send the consultation invitation to?",
    };
  }

  

  if (
    plan.action ===
    "capture_email"
  ) {
    console.log(
  "CURRENT STATE:",
  session.state
);

console.log(
  "BOOKING:",
  session.booking
);
    session.booking.email =
      plan.email;

    

    if (
      session.state ===
      "COLLECT_EMAIL"
    ) {
      const bookingResult =
        await runTool(
          "bookMeeting",
          {
            name:
              session.booking
                .name ||
              "Website Visitor",

            email:
              session.booking
                .email,

            service:
              "AI Consultation",

            slot:
              session.booking
                .slot,
          }
        );

      session.state =
        "COMPLETED";

      return {
        type:
          "booking_complete",

        response: `
Your consultation has been booked successfully.

Meet Link:
${bookingResult.meetLink}

A confirmation email has been sent to:
${session.booking.email}
        `,
      };
    }

    return {
      type: "text",

      response: `Thanks! I've saved your email as ${plan.email}.`,
    };
  }


  if (
    plan.action ===
    "show_slots"
  ) {
    const slots =
      await runTool(
        "getAvailableSlots"
      );

    session.state =
      "SHOW_SLOTS";

    return {
      type: "slots",

      slots,

      message:
        "I'd be happy to arrange a consultation. Here are the currently available slots:",
    };
  }



  if (
    plan.action ===
    "possible_booking"
  ) {
    session.state =
      "OFFER_CONSULTATION";

    return {
      type: "text",

      response:
        "Based on what you've shared, a short consultation with our team would help us recommend the best solution. Would you like me to show available slots?",
    };
  }

  

  const response =
    await salesAgent(
      session,
      userMessage
    );


  if (
    userMessage
      .toLowerCase()
      .includes(
        "automation"
      )
  ) {
    session.lead.painPoint =
      "Automation";
  }

  if (
    userMessage
      .toLowerCase()
      .includes(
        "crm"
      )
  ) {
    session.lead.painPoint =
      "CRM";
  }

  if (
    userMessage
      .toLowerCase()
      .includes(
        "chatbot"
      )
  ) {
    session.lead.painPoint =
      "Chatbot";
  }

  return {
    type: "text",

    response,
  };
}

module.exports =
  agentExecutor;