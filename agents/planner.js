const callGemini = require("../services/gemini");
const { getBookingBySession } = require("../database/bookingRepository");

// Intent detection helpers
const GREETING_WORDS = [
  "hi", "hello", "hey", "hola", "howdy", "greetings",
  "good morning", "good afternoon", "good evening",
  "what's up", "whats up", "sup", "yo"
];

const CANCEL_WORDS = [
  "cancel", "cancel my", "cancel meeting", "cancel consultation",
  "cancel booking", "don't want", "remove my booking",
  "cancel appointment", "cancel the meeting"
];

const RESCHEDULE_WORDS = [
  "reschedule", "change time", "change slot", "move my meeting",
  "different time", "change my booking", "change the time",
  "change my consultation", "move my consultation",
  "reschedule my", "pick another time", "new time",
  "change date", "move my booking"
];

const BOOKING_WORDS = [
  "book", "booking", "schedule", "consultation",
  "call", "meeting", "appointment", "show slots",
  "available slots", "arrange"
];

const DECLINE_WORDS = [
  "no", "nah", "not now", "not interested",
  "no thanks", "no thank you", "maybe later",
  "not right now", "i'll pass", "skip"
];

const AFFIRM_WORDS = [
  "yes", "yeah", "yep", "sure", "ok", "okay",
  "go ahead", "let's do it", "sounds good",
  "absolutely", "of course", "why not", "please"
];

function isGreeting(msg) {
  const trimmed = msg.toLowerCase().trim();
  // Pure greeting: message is very short and matches a greeting word/phrase
  if (trimmed.split(/\s+/).length <= 4) {
    return GREETING_WORDS.some(g => trimmed.includes(g));
  }
  return false;
}

function isCancelIntent(msg) {
  const lower = msg.toLowerCase();
  return CANCEL_WORDS.some(w => lower.includes(w));
}

function isRescheduleIntent(msg) {
  const lower = msg.toLowerCase();
  return RESCHEDULE_WORDS.some(w => lower.includes(w));
}

function isBookingIntent(msg) {
  const lower = msg.toLowerCase();
  return BOOKING_WORDS.some(w => lower.includes(w));
}

function isDecline(msg) {
  const lower = msg.toLowerCase().trim();
  return DECLINE_WORDS.some(w => lower === w || lower.startsWith(w + " ") || lower.startsWith(w + ","));
}

function isAffirm(msg) {
  const lower = msg.toLowerCase().trim();
  return AFFIRM_WORDS.some(w => lower.includes(w));
}

function hasServiceInterest(lead) {
  return !!(lead.painPoint || lead.service || lead.industry || lead.goal);
}

// Count how many user messages are in the conversation history
function getUserMessageCount(session) {
  if (!session.history || !Array.isArray(session.history)) return 0;
  return session.history.filter(m => m.role === "user").length;
}

async function planner(session, message) {
  const lead = session.lead || {};
  const state = session.state;
  const msg = message.toLowerCase().trim();
  const messageCount = getUserMessageCount(session);

  // ─── 1. CONFIRM_CANCEL state: waiting for cancel confirmation ───
  if (state === "CONFIRM_CANCEL") {
    if (isAffirm(msg)) {
      return { action: "execute_cancel" };
    }
    // User changed their mind
    return { action: "cancel_aborted" };
  }

  // ─── 2. RESCHEDULE_SLOTS state: user is selecting a new slot ───
  if (state === "RESCHEDULE_SLOTS") {
    const isSlotClick =
      msg.includes("book this slot") ||
      message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/) ||
      message.match(/(\d{1,2}\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{4})/i);

    if (isSlotClick) {
      return { action: "execute_reschedule" };
    }
    // They might be chatting while in reschedule state — fall through to general handling
  }

  // ─── 3. OFFER_CONSULTATION state: waiting for yes/no ───
  if (state === "OFFER_CONSULTATION") {
    if (isAffirm(msg)) {
      return { action: "show_slots" };
    }
    if (isDecline(msg)) {
      return { action: "decline_consultation" };
    }
    // Not a clear yes/no — fall through to general handling
  }

  // ─── 4. Post-booking states: detect cancel/reschedule intents ───
  if (state === "COMPLETED") {
    if (isCancelIntent(msg)) {
      return { action: "cancel_meeting" };
    }
    if (isRescheduleIntent(msg)) {
      return { action: "reschedule_meeting" };
    }
    if (isBookingIntent(msg)) {
      // Already booked — let salesAgent handle naturally
      return { action: "post_booking_chat" };
    }
    // Post-booking chat — continue conversation naturally
    return { action: "post_booking_chat" };
  }

  // ─── 5. CANCELLED state: user can rebook or chat ───
  if (state === "CANCELLED") {
    if (isBookingIntent(msg)) {
      return { action: "show_slots" };
    }
    if (isGreeting(msg)) {
      return { action: "greet" };
    }
    // Allow general conversation after cancellation
    return { action: "consult" };
  }

  // ─── 6. Global intent detection (any state) ───

  // 6a. Cancel intent from any state with a booking
  if (isCancelIntent(msg)) {
    const booking = await getBookingBySession(session.sessionId);
    if (booking) {
      return { action: "cancel_meeting" };
    }
  }

  // 6b. Reschedule intent from any state with a booking
  if (isRescheduleIntent(msg)) {
    const booking = await getBookingBySession(session.sessionId);
    if (booking) {
      return { action: "reschedule_meeting" };
    }
  }

  // 6c. Greeting — respond warmly (only if no state, early discovery, or first few messages)
  if (isGreeting(msg) && (!state || state === "DISCOVERY" || messageCount <= 2)) {
    return { action: "greet" };
  }

  // 6d. Email in message — only capture if we're in a booking flow context
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    // If we're in SHOW_SLOTS or COLLECT_EMAIL state, the state-based handler will pick this up
    if (state === "SHOW_SLOTS" || state === "COLLECT_EMAIL" || state === "COLLECT_NAME") {
      return { action: "capture_email", email: emailMatch[0] };
    }
    // If we're in general conversation and they provide email, capture it and offer slots
    if (hasServiceInterest(lead) || isBookingIntent(msg)) {
      return { action: "capture_email", email: emailMatch[0] };
    }
    // Otherwise just store it and continue conversation
    session.lead.email = emailMatch[0];
  }

  // 6e. Booking intent keywords
  if (isBookingIntent(msg)) {
    if (session.booking && !session.booking.email && !lead.email) {
      return { action: "capture_email" };
    }
    return { action: "show_slots" };
  }

  // ─── 7. Discovery flow (only after user has expressed service interest AND had some conversation) ───
  if (hasServiceInterest(lead) && messageCount >= 2) {
    // Business type known? Ask budget if missing
    if (!lead.budget && lead.budget !== "flexible" && lead.budget !== "not sure") {
      return { action: "discover_budget" };
    }

    // Budget known? Ask timeline if missing
    if (lead.budget && !lead.timeline) {
      return { action: "discover_timeline" };
    }

    // All info gathered? Offer consultation
    if (
      lead.budget &&
      lead.timeline &&
      state !== "OFFER_CONSULTATION" &&
      state !== "SHOW_SLOTS" &&
      state !== "COLLECT_EMAIL" &&
      state !== "COLLECT_NAME" &&
      state !== "COMPLETED" &&
      state !== "CANCELLED"
    ) {
      return { action: "offer_consultation" };
    }
  }

  // ─── 8. Date/time words suggesting booking intent ───
  const dateWords = ["today", "tomorrow", "june", "july", "august", "am", "pm", ":00", ":30"];
  if (dateWords.some(word => msg.includes(word)) && hasServiceInterest(lead)) {
    return { action: "show_slots" };
  }

  // ─── 9. Fallback to Gemini planner for knowledge/service questions ───
  const prompt = `
You are an AI planning engine for Nebo IT Solutions chatbot.

Business: ${lead.industry || "unknown"}
Budget: ${lead.budget || "unknown"}
Timeline: ${lead.timeline || "unknown"}
Current State: ${state || "DISCOVERY"}
Lead: ${JSON.stringify(session.lead)}
User Message: ${message}

Available Actions:
- answer_knowledge: User is asking about services, pricing, capabilities, company info
- discover_business: User mentioned a need but hasn't said what business they're in
- consult: General conversation, chit-chat, or anything else

Rules:
1. If the user asks about services, pricing, CRM, websites, chatbots, automation, AI, company info, or what Nebo does:
   { "action": "answer_knowledge" }

2. If the user mentions needing a service (chatbot, website, CRM, automation, software) AND their business type is unknown:
   { "action": "discover_business" }

3. For everything else (greetings, chit-chat, general questions):
   { "action": "consult" }

Return ONLY valid JSON.
`;

  const result = await callGemini(prompt);
  console.log("RAW PLANNER:", result);

  try {
    const cleaned = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.log("PLANNER PARSE ERROR:", err);
    return { action: "consult" };
  }
}

module.exports = planner;