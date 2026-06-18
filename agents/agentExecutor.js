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
  existingLead.pain_points,

  bookingSlot:
  existingLead.booking_slot || existingLead.bookingSlot
};


// Restore booking slot from DB
if(
 existingLead.booking_slot ||
 existingLead.bookingSlot
){
 session.booking = session.booking || {};
 session.booking.slot =
  existingLead.booking_slot ||
  existingLead.bookingSlot;
}


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
([key,value])=>{

if (
 value === null ||
 value === undefined ||
 value === ""
) {
 return;
}



session.lead[key]=value;


});





const lowerMessage =
userMessage.toLowerCase();



if(lowerMessage.includes("automation")){

session.lead.painPoint =
"Automation";

}


if(lowerMessage.includes("crm")){

session.lead.painPoint =
"CRM";

}


if(lowerMessage.includes("chatbot")){

session.lead.painPoint =
"Chatbot";

}





session.lead.score =
leadScorer(session.lead);



if(session.lead.score>=60){

session.lead.status="hot";

}
else if(session.lead.score>=30){

session.lead.status="warm";

}
else{

session.lead.status="cold";

}





/*
 SLOT SELECTED
*/

if(
session.state==="SHOW_SLOTS"
){


const msg =
userMessage.toLowerCase();


// Detect slot selection:
// 1. "Book this slot <slot>" prefix from button click
// 2. ISO date string (from slot value)
// 3. Date pattern like "18 Jun 2026, 10:00 am"
const isSlotClick =
 msg.includes("book this slot") ||
 userMessage.match(
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
 ) ||
 userMessage.match(
  /(\d{1,2}\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{4})/i
 );


if(isSlotClick){


const selectedSlot =
userMessage
.replace(
/book this slot/i,
""
)
.trim();


session.booking.slot =
selectedSlot;

session.lead.bookingSlot =
selectedSlot;



session.state =
"COLLECT_EMAIL";


session.lead.state =
session.state;



await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});



// If email already captured earlier, skip asking
if(
 session.booking.email ||
 session.lead.email
){

 session.booking.email =
  session.booking.email ||
  session.lead.email;

 session.lead.email =
  session.booking.email;

 // Directly book
 let bookingResult;
 try {

  console.log(
   "BOOKING TOOL INPUT (auto):",
   {
    slot: session.booking.slot,
    email: session.booking.email
   }
  );

  bookingResult =
  await runTools(
   ["bookMeeting"],
   {
    name: "Website Visitor",
    email: session.booking.email,
    service: "AI Consultation",
    slot: session.booking.slot
   }
  );

  console.log(
   "BOOKING RESULT (auto):",
   bookingResult
  );

 } catch(error) {
  console.error(
   "BOOKING FAILED (auto):",
   error
  );
  return {
   type: "text",
   response:
    "Sorry, I could not complete the booking. Please try again."
  };
 }

 const bookingResponse =
  bookingResult.bookMeeting;

 if(!bookingResponse.success){
  return {
   type: "text",
   response:
    "Sorry, that slot is no longer available. Please select another slot."
  };
 }

 const savedLead =
  await saveLead({
   sessionId: session.sessionId,
   lead: session.lead
  });

 await saveBooking({
  sessionId: session.sessionId,
  leadId: savedLead.id,
  name: "Website Visitor",
  email: session.booking.email,
  service: "AI Consultation",
  slot: session.booking.slot,
  meetLink: bookingResponse.meetLink,
  eventId: bookingResponse.eventId
 });

 session.state = "COMPLETED";
 session.lead.state = "COMPLETED";

 await saveLead({
  sessionId: session.sessionId,
  lead: session.lead
 });

 return {
  type: "booking_complete",
  response:
   `Your consultation has been booked successfully.\n\nMeet Link: ${bookingResponse.meetLink}\n\nA confirmation email has been sent to: ${session.booking.email}`
 };
}


return {

type:"text",

response:
"Perfect. What email should I send the consultation invitation to?"

};


}

}





/*
 EMAIL AFTER SLOT
*/

if(
session.state==="COLLECT_EMAIL"
){



if(
!session.booking.slot &&
!session.lead.bookingSlot
){

session.state="SHOW_SLOTS";

session.lead.state="SHOW_SLOTS";

await saveLead({
 sessionId:session.sessionId,
 lead:session.lead
});


return {
type:"text",
response:
"Please select a consultation slot first. Let me show available slots again."
};

}




if(
!session.booking.slot &&
session.lead.bookingSlot
){

session.booking.slot =
session.lead.bookingSlot;

}



const emailRegex =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;



if(
emailRegex.test(
userMessage.trim()
)

){



session.booking.email =
userMessage.trim();



session.lead.email =
userMessage.trim();



await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});


let bookingResult;

try {


console.log(
"BOOKING TOOL INPUT:",
{
slot:
session.booking.slot ||
session.lead.bookingSlot,

email:
session.booking.email
}
);


bookingResult =
await runTools(
[
"bookMeeting"
],
{

name:
"Website Visitor",

email:
session.booking.email,

service:
"AI Consultation",

slot:
session.booking.slot ||
session.lead.bookingSlot

}

);


console.log(
"BOOKING RESULT:",
bookingResult
);


}
catch(error){


console.error(
"BOOKING FAILED:",
error
);


return {

type:"text",

response:
"Sorry, I could not complete the booking. Please try again."

};

}



const bookingResponse =
bookingResult.bookMeeting;



if(!bookingResponse.success){


return {

type:"text",

response:
"Sorry, that slot is no longer available. Please select another slot."

};


}




const savedLead =
await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});




await saveBooking({

sessionId:
session.sessionId,

leadId:
savedLead.id,

name:
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





session.state =
"COMPLETED";


session.lead.state =
"COMPLETED";



await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});





return {

type:"booking_complete",

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


}





if(
session.state==="OFFER_CONSULTATION"
){


const msg =
userMessage.toLowerCase();



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
"schedule",
"show slots"
]
.some(x=>msg.includes(x))
){



session.state="SHOW_SLOTS";


session.lead.state =
session.state;


await saveLead({
sessionId:
session.sessionId,
lead:
session.lead
});


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





if(session.state==="COMPLETED"){


return {

type:"text",

response:
"Your consultation is already booked. Check your email for meeting details."

};


}





/*
 PLANNER
*/


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





/*
 EMAIL GIVEN BEFORE SLOT
*/


if(
plan.action==="capture_email"
){


const emailRegex =
/^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const email =
userMessage.match(emailRegex);



if(email){


session.booking.email =
email[0];


session.lead.email =
email[0];



await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});


}




session.state =
"SHOW_SLOTS";


session.lead.state =
"SHOW_SLOTS";



let slots =
await getAvailableSlots();



return {

type:"slots",

slots,

response:
"Thanks. Here are the available consultation slots."

};


}






if(
plan.action==="show_slots"
){


session.state="SHOW_SLOTS";


session.lead.state =
session.state;



await saveLead({

sessionId:
session.sessionId,

lead:
session.lead

});



let slots =
await getAvailableSlots();



return {

type:"slots",

slots,

response:
"I'd be happy to arrange a consultation. Here are the currently available slots:"

};


}






if(
plan.action==="offer_consultation"
){


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





if(
plan.action==="discover_business"
){

return {

type:"text",

response:
"I'd love to learn more about your business. What does your company do?"

};

}





if(
plan.action==="discover_budget"
){

return {

type:"text",

response:
"Do you have a rough budget range in mind for this project?"

};

}





if(
plan.action==="discover_timeline"
){

return {

type:"text",

response:
"What timeline are you aiming for to launch this project?"

};

}






if(
plan.action==="answer_knowledge"
){

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