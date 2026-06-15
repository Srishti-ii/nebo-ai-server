const {
  saveBooking
} =
require("../database/bookingRepository");


const {
  saveLead
}
=
require("../database/leadRepository");


const leadExtractor =
require("./leadExtractor");


const planner =
require("./planner");


const {
  runTools,
} = require("./toolRouter");


const salesAgent =
require("./salesAgent");


const isSlotSelected =
require("../tools/isSlotSelected");



async function agentExecutor(
  session,
  userMessage
) {


  if (!session.lead) {
    session.lead = {};
  }


  if (!session.booking) {
    session.booking = {};
  }


  if (!session.followups) {
    session.followups = {};
  }



  const leadData =
    await leadExtractor(
      session,
      userMessage
    );


  Object.entries(
    leadData
  ).forEach(
    ([key, value]) => {


      if (
        value === null ||
        value === undefined
      ) {
        return;
      }


      if (
        Array.isArray(value)
      ) {

        session.lead[key] =
        [
          ...(session.lead[key] || []),
          ...value
        ];

        return;
      }


      session.lead[key] =
        value;

    }
  );



  // Pain point detection BEFORE saving lead

  const lowerMessage =
    userMessage.toLowerCase();


  if (
    lowerMessage.includes("automation")
  ) {

    session.lead.painPoint =
      "Automation";

  }


  if (
    lowerMessage.includes("crm")
  ) {

    session.lead.painPoint =
      "CRM";

  }


  if (
    lowerMessage.includes("chatbot")
  ) {

    session.lead.painPoint =
      "Chatbot";

  }




  // Calculate status AFTER extraction

  if (
    (session.lead.score || 0) >= 60
  ) {

    session.lead.status =
      "hot";

  }
  else if (
    (session.lead.score || 0) >= 30
  ) {

    session.lead.status =
      "warm";

  }
  else {

    session.lead.status =
      "cold";

  }



  console.log(
    "CURRENT LEAD:",
    JSON.stringify(
      session.lead,
      null,
      2
    )
  );



  // Save final lead state

  await saveLead({

    sessionId:
      session.id,

    lead:
      session.lead

  });





  const plan =
    await planner(
      session,
      userMessage
    );



  console.log(
    "PLANNER OUTPUT:",
    plan
  );




  if (
    session.state === "SHOW_SLOTS" &&
    isSlotSelected(userMessage)
  ) {


    session.booking.slot =
      userMessage;


    session.state =
      "COLLECT_EMAIL";


    return {

      type:"text",

      response:
      "Perfect. What email should I send the consultation invitation to?"

    };

  }





  if (
    plan.action === "tool_call"
  ) {


    const results =
      await runTools(
        plan.tools,
        {
          session,
          userMessage
        }
      );


    const response =
      await salesAgent(
        session,
        `
User:
${userMessage}

Tool Results:
${JSON.stringify(
  results,
  null,
  2
)}
`
      );


    return {

      type:"text",

      response

    };

  }





  if (
    plan.action === "capture_email"
  ) {


    session.booking.email =
      plan.email;


    session.lead.email =
      plan.email;



    if (
      session.state === "COLLECT_EMAIL"
    ) {


      const results =
      await runTools([

        {

          name:"bookMeeting",

          payload:{

            name:
              session.booking.name ||
              "Website Visitor",

            email:
              session.booking.email,


            service:
              "AI Consultation",


            slot:
              session.booking.slot

          }

        }

      ]);



      const bookingResult =
        results[0].result;




      const savedLead =
        await saveLead({

          sessionId:
            session.id,

          lead:
            session.lead

        });




      // Booking database save protection

      try {


        await saveBooking({

          sessionId:
            session.id,


          leadId:
            savedLead.id,


          name:
            session.booking.name ||
            "Website Visitor",


          email:
            session.booking.email,


          service:
            "AI Consultation",


          slot:
            session.booking.slot,


          meetLink:
            bookingResult.meetLink,


          eventId:
            bookingResult.eventId

        });


      }
      catch(error){

        console.error(
          "BOOKING DATABASE SAVE FAILED:",
          error
        );

      }





      session.state =
        "COMPLETED";



      return {

        type:
          "booking_complete",


        response:
`
Your consultation has been booked successfully.

Meet Link:
${bookingResult.meetLink}

A confirmation email has been sent to:
${session.booking.email}
`

      };

    }




    return {

      type:"text",

      response:
      `Thanks! I've saved your email as ${plan.email}.`

    };

  }





  if (
    plan.action === "show_slots"
  ) {


    const results =
      await runTools([
        {
          name:"getAvailableSlots"
        }
      ]);



    const slots =
      results[0].result;



    session.state =
      "SHOW_SLOTS";



    return {

      type:"slots",

      slots,


      message:
      "I'd be happy to arrange a consultation. Here are the currently available slots:"

    };

  }





  if (
    plan.action === "offer_consultation"
  ) {


    session.state =
      "OFFER_CONSULTATION";



    return {

      type:"text",

      response:
      "Based on what you've shared, a short consultation with our team would help us recommend the best solution. Would you like me to show available slots?"

    };

  }





  if (
    plan.action === "discover_business"
  ) {

    return {

      type:"text",

      response:
      "I'd love to learn more about your business. What does your company do?"

    };

  }





  if (
    plan.action === "discover_timeline"
  ) {

    return {

      type:"text",

      response:
      "What timeline are you aiming for to launch this project?"

    };

  }





  if (
    plan.action === "answer_knowledge"
  ) {


    const knowledgeAgent =
      require("./knowledgeAgent");


    const answer =
      knowledgeAgent(
        userMessage
      );


    if(answer){

      return {

        type:"text",

        response:answer

      };

    }

  }





  if (
    plan.action === "discover_budget"
  ) {

    return {

      type:"text",

      response:
      "Do you have a rough budget range in mind for this project?"

    };

  }





  const response =
    await salesAgent(
      session,
      userMessage
    );



  return {

    type:"text",

    response

  };

}



module.exports =
agentExecutor;