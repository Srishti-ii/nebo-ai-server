const {
  saveBooking
} =
require("../database/bookingRepository");
const getAvailableSlots =
require("../tools/getAvailableSlots");

const {
  saveLead
}
=
require("../database/leadRepository");
const leadService =
require("../database/leadRepository");
const leadScorer =
require("./leadScorer");
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
const existingLead =
await leadService.getLeadBySession(
 session.sessionId
);

if(existingLead){

session.lead = {

...existingLead,

painPoint:
existingLead.pain_points

};


if(existingLead.state){

session.state =
existingLead.state;

}

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



session.lead.score =
leadScorer(session.lead);
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
//temp logs
console.log(
  "STATE BEFORE SLOT CHECK:",
  session.state
);
//temp logs
console.log(
  "USER MESSAGE:",
  userMessage
);

// HANDLE SLOT CLICK FIRST
if (
 isSlotSelected(userMessage)
){
//temp logs
    console.log("SLOT SELECTED");
//temp logs
  session.booking.slot =
    userMessage.replace(
      "Book this slot",
      ""
    ).trim();


  session.state =
    "COLLECT_EMAIL";
session.lead.state =
session.state;

  return {

    type:"text",

    response:
    "Perfect. What email should I send the consultation invitation to?"

  };

}
// HANDLE CONSULTATION ACCEPTANCE BEFORE ANY OTHER PLAN

if(
session.state === "OFFER_CONSULTATION"
){

const msg =
userMessage.toLowerCase().trim();


if(
[
"yes",
"yeah",
"yep",
"sure",
"ok",
"okay",
"go ahead",
"book",
"book it",
"schedule",
"show slots",
"let's do it"
]
.some(x=>msg.includes(x))
){

session.state="SHOW_SLOTS";

session.lead.state =
session.state;

let slots =
await getAvailableSlots();


return {

type:"slots",

slots,

response:
"Great! Here are the available consultation slots."

};

}

}



const plan =
await planner(
 session,
 userMessage
);
  await saveLead({

    sessionId:
    session.sessionId,

    lead:
      session.lead

  });



  console.log(
    "PLANNER OUTPUT:",
    plan
  );


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
const bookingResult =
await runTools(
[
"bookMeeting"
],
{
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
);


const bookingResponse =
bookingResult.bookMeeting;


if(!bookingResponse.success){

return {

type:"text",

response:
"Sorry, I couldn't complete the booking. Please select another slot."

};

}

      const savedLead =
        await saveLead({

          sessionId:
          session.sessionId,

          lead:
            session.lead

        });



      try {


        await saveBooking({

          sessionId:
            session.sessionId,


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
            bookingResponse.meetLink,


          eventId:
            bookingResponse.eventId

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
session.lead.state =
session.state;


      return {

        type:
          "booking_complete",


        response:
`
Your consultation has been booked successfully.

Meet Link:
${bookingResponse.meetLink}

A confirmation email has been sent to:
${session.booking.email}
`

      };

    }


return {

type:"text",

response:
`Great, I'll help you schedule a consultation. Let me show you the available slots.`

};}

if (
  plan.action === "show_slots"
) {
session.state =
"SHOW_SLOTS";

session.lead.state =
session.state;

   let slots =
await getAvailableSlots();


const userText =
userMessage.toLowerCase();


const requestedDay =
userText.match(
 /(\d{1,2})\s*(june|july|august|september|october|november|december)/i
);


if(requestedDay){

 const day =
 Number(requestedDay[1]);


 slots =
 slots.filter(slot=>{

   const d =
   new Date(slot.value);


   return d.getDate()===day;

 });

}

    return {

      type:"slots",

      slots,


      response:
      "I'd be happy to arrange a consultation. Here are the currently available slots:"

    };

  }

if (
  plan.action === "offer_consultation"
) {

session.state =
"OFFER_CONSULTATION";
session.lead.state =
session.state;


await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});



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