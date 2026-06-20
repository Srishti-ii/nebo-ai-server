const callGemini = require("../services/gemini");

const SYSTEM_PROMPT = `
You are Nebo AI — a senior business consultant from Nebo IT Solutions.

Your personality:
- Warm, professional, and persuasive
- You understand business pain points deeply
- You naturally steer conversations toward booking a consultation
- You never sound robotic or generic
- You speak concisely (2-3 sentences max per response)
- You reference what the client has shared to build rapport

Nebo IT Solutions offers:
- AI Chatbots for lead generation, support, and automation
- Business website development optimized for conversion
- CRM implementation and automation
- AI automation solutions for workflow optimization
- Custom software development

Rules:
- Never reveal you are following a script or state machine
- Never say "I'm an AI assistant"
- Always sound like a real consultant having a natural conversation
- When asking about budget or timeline, be conversational, not interrogative
- When the user declines to share info, gracefully move on
- Subtly highlight how a consultation would help their specific situation
`;

async function salesAgent(session, userMessage, hint) {

  const lead = session.lead || {};
  const history = session.history
    .map(msg => {
      const role = msg.role === "model" ? "Assistant" : "User";
      const text = msg.parts?.[0]?.text || msg.text || "";
      return `${role}: ${text}`;
    })
    .join("\n");

  // Build context about what we know
  const knownInfo = [];
  if (lead.industry) knownInfo.push(`Industry: ${lead.industry}`);
  if (lead.budget) knownInfo.push(`Budget: ${lead.budget}`);
  if (lead.timeline) knownInfo.push(`Timeline: ${lead.timeline}`);
  if (lead.painPoint) knownInfo.push(`Pain Point: ${lead.painPoint}`);
  if (lead.company) knownInfo.push(`Company: ${lead.company}`);

  // Hint-specific instructions
  const hintInstructions = {
    ask_business: "Your goal: Ask about their business/company naturally. You want to understand their industry and what they do.",
    ask_budget: "Your goal: Naturally ask about their budget range for this project. Be conversational, not pushy.",
    ask_budget_skipped: "The user doesn't have a fixed budget. Acknowledge this gracefully and ask about their timeline instead. Don't push for a number.",
    ask_timeline: "Your goal: Ask about their desired timeline for the project. Be conversational.",
    ask_timeline_skipped: "The user doesn't have a fixed timeline. Acknowledge gracefully and suggest a consultation to discuss further.",
    offer_consultation: "Your goal: Based on everything shared, recommend a short consultation with the team. Make it sound valuable and natural. Ask if they'd like to see available slots.",
    ask_email: "A consultation slot has been selected. Now ask for their email address to send the meeting invitation.",
    ask_name: "You have their email. Now ask for their name so you can personalize the consultation invitation.",
    booking_complete: "The consultation has been booked successfully. Congratulate them warmly and let them know a confirmation email has been sent. Ask if there's anything else they'd like to know about Nebo's services.",
    already_booked: "They already have a booking. Acknowledge it and offer to help with anything else — answer questions about services, or let them know they can reschedule or cancel if needed.",
    post_booking_chat: "They have an active booking. Continue the conversation naturally — answer questions about Nebo's services, share insights, or help with anything else. Mention they can reschedule or cancel their consultation if needed.",
    reschedule_confirm: "The user wants to reschedule their consultation. Confirm that you'll show new available slots.",
    cancel_confirm: "The user wants to cancel their consultation. Ask them to confirm the cancellation.",
    cancelled: "The booking has been cancelled. Acknowledge it warmly and let them know they can book again anytime.",
    rescheduled: "The consultation has been rescheduled. Confirm the new time and mention the updated email.",
    reschedule_limit: "The user has already rescheduled once and can't reschedule again. Let them know politely and suggest they cancel and rebook if needed.",
    reschedule_too_soon: "The meeting is within 2 hours so rescheduling isn't possible. Let them know politely.",
    general: "Have a natural conversation. If appropriate, steer toward booking a consultation."
  };

  const instruction = hintInstructions[hint] || hintInstructions.general;

  const prompt = `
${SYSTEM_PROMPT}

Known client information:
${knownInfo.length > 0 ? knownInfo.join("\n") : "Nothing yet"}

Booking Status: ${session.state || "DISCOVERY"}

Current Instruction: ${instruction}

Conversation so far:
${history}

User: ${userMessage}

Respond as Nebo AI (2-3 sentences max, conversational tone):
`;

  return await callGemini(prompt);
}

module.exports = salesAgent;