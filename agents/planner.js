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

5. If the user asks to schedule, book, arrange, or wants a consultation:
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