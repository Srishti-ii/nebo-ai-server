const callGemini =
  require("../services/gemini");

async function planner(
  session,
  message
) { const lead = session.lead || {};
  const prompt = `
You are an AI planning engine.
Business:
${lead.industry || "unknown"}

Budget:
${lead.budget || "unknown"}

Timeline:
${lead.timeline || "unknown"}
Current State:
${session.state}

Lead:
${JSON.stringify(session.lead)}

User Message:
${message}

Available Actions:

discover_business
discover_budget
discover_timeline
offer_consultation
show_slots
capture_email
answer_knowledge
consult

If answering requires more than one tool:

{
  "action":"tool_call",
  "tools":[
    "knowledgeSearch",
    "getAvailableSlots"
  ]
}
  
Rules:

1. If the user mentions needing a chatbot, automation, CRM, AI solution, website, software, or business service AND business type is unknown:
{
  "action":"discover_business"
}

2. If business/industry is already known but budget is missing:
{
  "action":"discover_budget"
}

3. If budget is known but timeline is missing:
{
  "action":"discover_timeline"
}

4. If business, budget, and timeline are known:
{
  "action":"offer_consultation"
}

5. If the user asks to schedule, book, arrange, wants a consultation,
OR mentions a date/time preference:

If email is missing:
{
  "action":"capture_email"
}

If email exists:
{
  "action":"show_slots"
}

6. If the message contains an email address:
{
  "action":"capture_email",
  "email":"the_email"
}

7. If the user asks about services, pricing, CRM, websites, chatbots, automation, or company information:
{
  "action":"answer_knowledge"
}

8. Otherwise:
{
  "action":"consult"
}

Return ONLY valid JSON.
`;
// BUSINESS KNOWN
// BUDGET MISSING

if (
  lead.industry &&
  !lead.budget
) {
  return {
    action:
      "discover_budget"
  };
}

// INDUSTRY + BUDGET KNOWN
// TIMELINE MISSING

if (
  lead.industry &&
  lead.budget &&
  !lead.timeline
) {
  return {
    action:
      "discover_timeline"
  };
}

// EVERYTHING KNOWN

if (
  lead.industry &&
  lead.budget &&
  lead.timeline
) {
  return {
    action:
      "offer_consultation"
  };
}
const msg =
message.toLowerCase();


if (
  msg.includes("book") ||
  msg.includes("booking") ||
  msg.includes("schedule") ||
  msg.includes("consultation") ||
  msg.includes("call") ||
  msg.includes("meeting")
) {

  return {
    action:"show_slots"
  };

}


if (
  session.state ===
  "OFFER_CONSULTATION"
) {

  if (
    msg.includes("yes") ||
    msg.includes("sure") ||
    msg.includes("okay")
  ) {

    return {
      action:"show_slots"
    };

  }

}

const dateWords =
[
"today",
"tomorrow",
"june",
"july",
"am",
"pm",
":00",
":30"
];


if(
 dateWords.some(word =>
 msg.includes(word)
 )
){

 return {
   action:"show_slots"
 };

}
// EMAIL REQUIRED BEFORE BOOKING

if(
 session.booking &&
 !session.booking.email &&
 (
  message.toLowerCase().includes("book") ||
  message.toLowerCase().includes("schedule") ||
  message.toLowerCase().includes("consultation")
 )
){

return {
 action:"capture_email"
};

}
  const result =
    await callGemini(prompt);
console.log(
  "RAW PLANNER:",
  result
);

try {

  const cleaned =
    result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

  return JSON.parse(cleaned);

} catch (err) {

  console.log(
    "PLANNER PARSE ERROR:",
    err
  );

  return {
    action: "consult"
  };
}
}

module.exports =
  planner;