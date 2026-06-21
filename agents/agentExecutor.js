const { saveBooking, getBookingBySession } = require("../database/bookingRepository");
const getAvailableSlots = require("../tools/getAvailableSlots");
const { saveLead } = require("../database/leadRepository");
const leadService = require("../database/leadRepository");
const leadScorer = require("./leadScorer");
const leadExtractor = require("./leadExtractor");
const planner = require("./planner");
const { runTools } = require("./toolRouter");
const salesAgent = require("./salesAgent");
const { canReschedule, rescheduleBooking, cancelBookingFlow } = require("../services/bookingManager");


// ─── Helper: extract name and email from a message ───
function extractNameAndEmail(message) {
  const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const emailMatch = message.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : null;

  // Remove the email from the message to find the name
  let nameCandidate = message
    .replace(emailRegex, "")
    .replace(/[,.\-:;]/g, " ")
    .replace(/\b(my name is|i'm|i am|name is|it's|its)\b/gi, "")
    .replace(/\b(my email is|email is|email)\b/gi, "")
    .replace(/\b(and|also)\b/gi, "")
    .trim();

  // Clean up excessive whitespace
  nameCandidate = nameCandidate.replace(/\s+/g, " ").trim();

  // If the remaining text is a reasonable name (1-4 words, no weird chars)
  const name = (nameCandidate.length > 0 && nameCandidate.length < 60 && nameCandidate.split(/\s+/).length <= 4)
    ? nameCandidate
    : null;

  return { name, email };
}


// ─── Helper: format slot for display ───
function formatSlot(slot) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(slot));
  } catch {
    return slot;
  }
}


// ─── Helper: book the meeting (DRY) ───
async function executeBooking(session, name, email) {
  const slot = session.booking.slot || session.lead.bookingSlot;

  let bookingResult;
  try {
    console.log("BOOKING TOOL INPUT:", { slot, email, name });
    bookingResult = await runTools(["bookMeeting"], {
      name: name || "Website Visitor",
      email,
      service: "AI Consultation",
      slot
    });
    console.log("BOOKING RESULT:", bookingResult);
  } catch (error) {
    console.error("BOOKING FAILED:", error);
    return { success: false, error: "booking_failed" };
  }

  const bookingResponse = bookingResult.bookMeeting;
  if (!bookingResponse.success) {
    return { success: false, error: "slot_unavailable" };
  }

  // Save lead
  session.lead.name = name || session.lead.name;
  session.lead.email = email;
  const savedLead = await saveLead({
    sessionId: session.sessionId,
    lead: session.lead
  });

  // Save booking
  await saveBooking({
    sessionId: session.sessionId,
    leadId: savedLead.id,
    name: name || "Website Visitor",
    email,
    service: "AI Consultation",
    slot,
    meetLink: bookingResponse.meetLink,
    eventId: bookingResponse.eventId
  });

  // Update state
  session.state = "COMPLETED";
  session.lead.state = "COMPLETED";
  await saveLead({
    sessionId: session.sessionId,
    lead: session.lead
  });

  return {
    success: true,
    meetLink: bookingResponse.meetLink,
    email
  };
}


async function agentExecutor(session, userMessage) {
  // ─── Initialize session fields ───
  if (!session.lead) session.lead = {};
  if (!session.booking) session.booking = {};
  if (!session.followups) session.followups = {};

  // ─── Load existing lead from DB ───
  const existingLead = await leadService.getLeadBySession(session.sessionId);
  if (existingLead && existingLead.id) {
    session.lead = {
      ...session.lead,
      ...existingLead,
      painPoint: existingLead.pain_points || session.lead.painPoint,
      bookingSlot: existingLead.booking_slot || existingLead.bookingSlot || session.lead.bookingSlot
    };
    if (existingLead.booking_slot || existingLead.bookingSlot) {
      session.booking = session.booking || {};
      session.booking.slot = existingLead.booking_slot || existingLead.bookingSlot;
    }
    if (existingLead.state) {
      session.state = existingLead.state;
    }
    if (existingLead.email) {
      session.booking.email = existingLead.email;
    }
    if (existingLead.name) {
      session.booking.name = existingLead.name;
    }
  }

  // ─── Extract lead data from message ───
  const leadData = await leadExtractor(session, userMessage);
  Object.entries(leadData).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    session.lead[key] = value;
  });

  // Quick pain point detection
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes("automation")) session.lead.painPoint = "Automation";
  if (lowerMessage.includes("crm")) session.lead.painPoint = "CRM";
  if (lowerMessage.includes("chatbot")) session.lead.painPoint = "Chatbot";
  if (lowerMessage.includes("website")) session.lead.painPoint = "Website";
  if (lowerMessage.includes("software")) session.lead.painPoint = "Software";
  if (lowerMessage.includes("ai")) session.lead.painPoint = "AI Solutions";

  // Score the lead
  session.lead.score = leadScorer(session.lead);
  if (session.lead.score >= 60) session.lead.status = "hot";
  else if (session.lead.score >= 30) session.lead.status = "warm";
  else session.lead.status = "cold";


  // ═══════════════════════════════════════════════════════════════
  // STATE-BASED HANDLING (before planner)
  // ═══════════════════════════════════════════════════════════════

  // ─── CONFIRM_CANCEL: User confirming cancellation ───
  if (session.state === "CONFIRM_CANCEL") {
    const affirm = ["yes", "yeah", "yep", "sure", "ok", "okay", "go ahead", "confirm", "do it"];
    if (affirm.some(w => lowerMessage.includes(w))) {
      // Execute cancellation
      try {
        const result = await cancelBookingFlow(session.sessionId);
        if (result.success) {
          session.state = "CANCELLED";
          session.lead.state = "CANCELLED";
          await saveLead({ sessionId: session.sessionId, lead: session.lead });
          const response = await salesAgent(session, userMessage, "cancelled");
          return { type: "text", response };
        }
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "I'm sorry, I couldn't process the cancellation right now. Please try again." };
      } catch (error) {
        console.error("CANCEL FLOW ERROR:", error);
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "Something went wrong while cancelling. Please try again." };
      }
    }
    // User changed their mind about cancelling
    session.state = "COMPLETED";
    session.lead.state = "COMPLETED";
    await saveLead({ sessionId: session.sessionId, lead: session.lead });
    const response = await salesAgent(session, userMessage, "cancel_aborted");
    return { type: "text", response };
  }


  // ─── RESCHEDULE_SLOTS: User selecting a new slot for reschedule ───
  if (session.state === "RESCHEDULE_SLOTS") {
    const msg = userMessage.toLowerCase();
    const isSlotClick =
      msg.includes("book this slot") ||
      userMessage.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/) ||
      userMessage.match(/(\d{1,2}\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{4})/i);

    if (isSlotClick) {
      const selectedSlot = userMessage.replace(/book this slot/i, "").trim();
      try {
        const result = await rescheduleBooking({
          sessionId: session.sessionId,
          newSlot: selectedSlot,
          name: session.lead.name || "Website Visitor"
        });

        if (result.success) {
          session.state = "COMPLETED";
          session.lead.state = "COMPLETED";
          session.booking.slot = selectedSlot;
          session.lead.bookingSlot = selectedSlot;
          await saveLead({ sessionId: session.sessionId, lead: session.lead });

          const response = await salesAgent(session, userMessage, "rescheduled");
          return {
            type: "booking_complete",
            response: response || `Your consultation has been rescheduled successfully!\n\nNew Time: ${formatSlot(selectedSlot)}\nMeet Link: ${result.meetLink}\n\nAn updated invitation has been sent to your email.`
          };
        }

        if (result.reason === "too_soon") {
          session.state = "COMPLETED";
          session.lead.state = "COMPLETED";
          await saveLead({ sessionId: session.sessionId, lead: session.lead });
          const response = await salesAgent(session, userMessage, "reschedule_too_soon");
          return { type: "text", response };
        }

        const response = await salesAgent(session, userMessage, "slot_error");
        return { type: "text", response: response || "Sorry, I couldn't reschedule to that slot. Please try selecting another one." };
      } catch (error) {
        console.error("RESCHEDULE ERROR:", error);
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "Something went wrong while rescheduling. Please try again." };
      }
    }

    // Not a slot click — user is chatting while reschedule slots are shown
    // Check if they want to cancel instead, or just respond naturally
    if (lowerMessage.includes("cancel") || lowerMessage.includes("never mind") || lowerMessage.includes("nevermind")) {
      session.state = "COMPLETED";
      session.lead.state = "COMPLETED";
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const response = await salesAgent(session, userMessage, "post_booking_chat");
      return { type: "text", response };
    }

    // Still show slots context but answer their question
    const response = await salesAgent(session, userMessage, "reschedule_waiting");
    return { type: "text", response };
  }


  // ─── SHOW_SLOTS: User selecting a slot for NEW booking ───
  if (session.state === "SHOW_SLOTS") {
    const msg = userMessage.toLowerCase();
    const isSlotClick =
      msg.includes("book this slot") ||
      userMessage.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/) ||
      userMessage.match(/(\d{1,2}\s(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s\d{4})/i);

    if (isSlotClick) {
      const selectedSlot = userMessage.replace(/book this slot/i, "").trim();
      session.booking.slot = selectedSlot;
      session.lead.bookingSlot = selectedSlot;
      session.state = "COLLECT_EMAIL";
      session.lead.state = session.state;
      await saveLead({ sessionId: session.sessionId, lead: session.lead });

      // If we already have both name and email, book directly
      if ((session.booking.email || session.lead.email) && (session.booking.name || session.lead.name)) {
        const email = session.booking.email || session.lead.email;
        const name = session.booking.name || session.lead.name;
        session.booking.email = email;
        session.lead.email = email;

        const bookResult = await executeBooking(session, name, email);
        if (bookResult.success) {
          const response = await salesAgent(session, userMessage, "booking_complete");
          return {
            type: "booking_complete",
            response: response || `Your consultation has been booked successfully! ✅\n\nMeet Link: ${bookResult.meetLink}\n\nA confirmation email has been sent to: ${bookResult.email}`
          };
        }
        if (bookResult.error === "slot_unavailable") {
          const response = await salesAgent(session, userMessage, "slot_error");
          return { type: "text", response: response || "Sorry, that slot is no longer available. Please select another slot." };
        }
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "Sorry, I could not complete the booking. Please try again." };
      }

      // If we have email but no name
      if (session.booking.email || session.lead.email) {
        session.state = "COLLECT_NAME";
        session.lead.state = "COLLECT_NAME";
        await saveLead({ sessionId: session.sessionId, lead: session.lead });
        const response = await salesAgent(session, userMessage, "ask_name");
        return { type: "text", response };
      }

      // Need both name and email
      const response = await salesAgent(session, userMessage, "ask_name_email");
      return { type: "text", response };
    }

    // Not a slot click — user might be chatting or declining
    const declineWords = ["no", "nah", "not now", "not interested", "no thanks", "maybe later", "skip", "not right now"];
    if (declineWords.some(w => msg === w || msg.startsWith(w + " ") || msg.startsWith(w + ","))) {
      session.state = "DISCOVERY";
      session.lead.state = "DISCOVERY";
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const response = await salesAgent(session, userMessage, "decline_consultation");
      return { type: "text", response };
    }

    // Answer their question while slots are shown
    const response = await salesAgent(session, userMessage, "slots_waiting");
    return { type: "text", response };
  }


  // ─── COLLECT_EMAIL: Collecting email (and possibly name) after slot selection ───
  if (session.state === "COLLECT_EMAIL") {
    // Restore slot if lost
    if (!session.booking.slot && session.lead.bookingSlot) {
      session.booking.slot = session.lead.bookingSlot;
    }
    if (!session.booking.slot) {
      session.state = "SHOW_SLOTS";
      session.lead.state = "SHOW_SLOTS";
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const slots = await getAvailableSlots();
      return {
        type: "slots",
        slots,
        response: "Let me show you the available slots again."
      };
    }

    const { name, email } = extractNameAndEmail(userMessage);

    if (email) {
      session.booking.email = email;
      session.lead.email = email;

      if (name) {
        session.booking.name = name;
        session.lead.name = name;
      }

      await saveLead({ sessionId: session.sessionId, lead: session.lead });

      // If we have a name (from this message or prior), book directly
      if (session.booking.name || session.lead.name) {
        const bookName = session.booking.name || session.lead.name;
        const bookResult = await executeBooking(session, bookName, email);
        if (bookResult.success) {
          const response = await salesAgent(session, userMessage, "booking_complete");
          return {
            type: "booking_complete",
            response: response || `Your consultation has been booked successfully! ✅\n\nMeet Link: ${bookResult.meetLink}\n\nA confirmation email has been sent to: ${bookResult.email}`
          };
        }
        if (bookResult.error === "slot_unavailable") {
          const response = await salesAgent(session, userMessage, "slot_error");
          return { type: "text", response: response || "Sorry, that slot is no longer available. Please select another slot." };
        }
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "Sorry, I could not complete the booking. Please try again." };
      }

      // Need name still
      session.state = "COLLECT_NAME";
      session.lead.state = "COLLECT_NAME";
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const response = await salesAgent(session, userMessage, "ask_name");
      return { type: "text", response };
    }

    // No email found — check if just a name was provided
    if (name && !email) {
      session.booking.name = name;
      session.lead.name = name;
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const response = await salesAgent(session, userMessage, "ask_email");
      return { type: "text", response };
    }

    // Neither name nor email — ask again warmly
    const response = await salesAgent(session, userMessage, "ask_name_email");
    return { type: "text", response };
  }


  // ─── COLLECT_NAME: Have email, need name ───
  if (session.state === "COLLECT_NAME") {
    // The message is likely their name
    const nameCandidate = userMessage
      .replace(/\b(my name is|i'm|i am|name is|it's|its)\b/gi, "")
      .replace(/[,.\-:;]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Also check if they included email in this message
    const { name: extractedName, email: extractedEmail } = extractNameAndEmail(userMessage);

    if (extractedEmail) {
      session.booking.email = extractedEmail;
      session.lead.email = extractedEmail;
    }

    const finalName = extractedName || nameCandidate;
    if (finalName && finalName.length > 0 && finalName.length < 60) {
      session.booking.name = finalName;
      session.lead.name = finalName;
      await saveLead({ sessionId: session.sessionId, lead: session.lead });

      const email = session.booking.email || session.lead.email;
      if (email && session.booking.slot) {
        const bookResult = await executeBooking(session, finalName, email);
        if (bookResult.success) {
          const response = await salesAgent(session, userMessage, "booking_complete");
          return {
            type: "booking_complete",
            response: response || `Your consultation has been booked successfully! ✅\n\nMeet Link: ${bookResult.meetLink}\n\nA confirmation email has been sent to: ${bookResult.email}`
          };
        }
        if (bookResult.error === "slot_unavailable") {
          const response = await salesAgent(session, userMessage, "slot_error");
          return { type: "text", response: response || "Sorry, that slot is no longer available. Please select another slot." };
        }
        const response = await salesAgent(session, userMessage, "error_generic");
        return { type: "text", response: response || "Sorry, I could not complete the booking. Please try again." };
      }

      // Need email
      const response = await salesAgent(session, userMessage, "ask_email");
      return { type: "text", response };
    }

    // Couldn't parse a name
    const response = await salesAgent(session, userMessage, "ask_name");
    return { type: "text", response };
  }


  // ─── OFFER_CONSULTATION: Waiting for yes/no ───
  if (session.state === "OFFER_CONSULTATION") {
    const declineWords = ["no", "nah", "not now", "not interested", "no thanks", "no thank you", "maybe later", "not right now", "skip"];
    const affirmWords = ["yes", "yeah", "yep", "sure", "ok", "okay", "go ahead", "book", "schedule", "show slots", "let's do it", "sounds good"];

    if (affirmWords.some(x => lowerMessage.includes(x))) {
      session.state = "SHOW_SLOTS";
      session.lead.state = session.state;
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const slots = await getAvailableSlots();
      const response = await salesAgent(session, userMessage, "showing_slots");
      return {
        type: "slots",
        slots,
        response: response || "Great! Here are the available consultation slots."
      };
    }

    if (declineWords.some(x => lowerMessage === x || lowerMessage.startsWith(x + " ") || lowerMessage.startsWith(x + ","))) {
      session.state = "DISCOVERY";
      session.lead.state = "DISCOVERY";
      await saveLead({ sessionId: session.sessionId, lead: session.lead });
      const response = await salesAgent(session, userMessage, "decline_consultation");
      return { type: "text", response };
    }

    // User asked something else while in OFFER_CONSULTATION — answer it naturally
    const response = await salesAgent(session, userMessage, "general");
    return { type: "text", response };
  }


  // ═══════════════════════════════════════════════════════════════
  // PLANNER — determines next action
  // ═══════════════════════════════════════════════════════════════

  const plan = await planner(session, userMessage);
  await saveLead({ sessionId: session.sessionId, lead: session.lead });

  console.log("PLANNER ACTION:", plan.action, "STATE:", session.state);


  // ─── GREET: Natural greeting via salesAgent ───
  if (plan.action === "greet") {
    const response = await salesAgent(session, userMessage, "greet");
    return { type: "text", response };
  }


  // ─── CANCEL_MEETING: Initiate cancel flow ───
  if (plan.action === "cancel_meeting") {
    const booking = await getBookingBySession(session.sessionId);
    if (!booking) {
      const response = await salesAgent(session, userMessage, "no_booking");
      return { type: "text", response };
    }
    session.state = "CONFIRM_CANCEL";
    session.lead.state = "CONFIRM_CANCEL";
    await saveLead({ sessionId: session.sessionId, lead: session.lead });

    // Pass booking details to salesAgent so it can mention the scheduled time
    session._currentBooking = booking;
    const response = await salesAgent(session, userMessage, "cancel_confirm");
    delete session._currentBooking;
    return { type: "text", response };
  }

  // ─── EXECUTE_CANCEL: Planner confirmed cancel ───
  if (plan.action === "execute_cancel") {
    try {
      const result = await cancelBookingFlow(session.sessionId);
      if (result.success) {
        session.state = "CANCELLED";
        session.lead.state = "CANCELLED";
        await saveLead({ sessionId: session.sessionId, lead: session.lead });
        const response = await salesAgent(session, userMessage, "cancelled");
        return { type: "text", response };
      }
      const response = await salesAgent(session, userMessage, "error_generic");
      return { type: "text", response: response || "I'm sorry, I couldn't process the cancellation. Please try again." };
    } catch (error) {
      console.error("CANCEL ERROR:", error);
      const response = await salesAgent(session, userMessage, "error_generic");
      return { type: "text", response: response || "Something went wrong. Please try again." };
    }
  }

  // ─── CANCEL_ABORTED: User changed their mind ───
  if (plan.action === "cancel_aborted") {
    session.state = "COMPLETED";
    session.lead.state = "COMPLETED";
    await saveLead({ sessionId: session.sessionId, lead: session.lead });
    const response = await salesAgent(session, userMessage, "cancel_aborted");
    return { type: "text", response };
  }


  // ─── RESCHEDULE_MEETING: Initiate reschedule flow ───
  if (plan.action === "reschedule_meeting") {
    const check = await canReschedule(session.sessionId);
    if (!check.allowed) {
      if (check.reason === "no_booking") {
        const response = await salesAgent(session, userMessage, "no_booking");
        return { type: "text", response };
      }
      if (check.reason === "too_soon") {
        const response = await salesAgent(session, userMessage, "reschedule_too_soon");
        return { type: "text", response };
      }
    }

    session.state = "RESCHEDULE_SLOTS";
    session.lead.state = "RESCHEDULE_SLOTS";
    await saveLead({ sessionId: session.sessionId, lead: session.lead });

    const slots = await getAvailableSlots();
    const response = await salesAgent(session, userMessage, "reschedule_confirm");
    return {
      type: "slots",
      slots,
      response: response || "Of course! Here are the available slots for rescheduling:"
    };
  }

  // ─── EXECUTE_RESCHEDULE: handled in state-based section above ───


  // ─── POST_BOOKING_CHAT: After booking, continue conversation ───
  if (plan.action === "post_booking_chat") {
    const response = await salesAgent(session, userMessage, "post_booking_chat");
    return { type: "text", response };
  }

  // ─── DECLINE_CONSULTATION: User said no to consultation ───
  if (plan.action === "decline_consultation") {
    session.state = "DISCOVERY";
    session.lead.state = "DISCOVERY";
    await saveLead({ sessionId: session.sessionId, lead: session.lead });
    const response = await salesAgent(session, userMessage, "decline_consultation");
    return { type: "text", response };
  }


  // ─── CAPTURE_EMAIL: Email given before slot selection ───
  if (plan.action === "capture_email") {
    const emailMatch = userMessage.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    if (emailMatch) {
      session.booking.email = emailMatch[0];
      session.lead.email = emailMatch[0];

      // Also extract name if present
      const { name } = extractNameAndEmail(userMessage);
      if (name) {
        session.booking.name = name;
        session.lead.name = name;
      }

      await saveLead({ sessionId: session.sessionId, lead: session.lead });
    }
    session.state = "SHOW_SLOTS";
    session.lead.state = "SHOW_SLOTS";
    const slots = await getAvailableSlots();
    const response = await salesAgent(session, userMessage, "showing_slots");
    return {
      type: "slots",
      slots,
      response: response || "Thanks! Here are the available consultation slots."
    };
  }


  // ─── SHOW_SLOTS: Display available time slots ───
  if (plan.action === "show_slots") {
    session.state = "SHOW_SLOTS";
    session.lead.state = session.state;
    await saveLead({ sessionId: session.sessionId, lead: session.lead });
    const slots = await getAvailableSlots();
    const response = await salesAgent(session, userMessage, "showing_slots");
    return {
      type: "slots",
      slots,
      response: response || "I'd be happy to arrange a consultation. Here are the currently available slots:"
    };
  }


  // ─── OFFER_CONSULTATION: Suggest a consultation ───
  if (plan.action === "offer_consultation") {
    session.state = "OFFER_CONSULTATION";
    session.lead.state = session.state;
    await saveLead({ sessionId: session.sessionId, lead: session.lead });
    const response = await salesAgent(session, userMessage, "offer_consultation");
    return { type: "text", response };
  }


  // ─── DISCOVER_BUSINESS: Ask about their business ───
  if (plan.action === "discover_business") {
    const response = await salesAgent(session, userMessage, "ask_business");
    return { type: "text", response };
  }

  // ─── DISCOVER_BUDGET: Ask about budget ───
  if (plan.action === "discover_budget") {
    const response = await salesAgent(session, userMessage, "ask_budget");
    return { type: "text", response };
  }

  // ─── DISCOVER_TIMELINE: Ask about timeline ───
  if (plan.action === "discover_timeline") {
    const response = await salesAgent(session, userMessage, "ask_timeline");
    return { type: "text", response };
  }


  // ─── ANSWER_KNOWLEDGE: Answer from knowledge base ───
  if (plan.action === "answer_knowledge") {
    const knowledgeAgent = require("./knowledgeAgent");
    const answer = knowledgeAgent(userMessage);
    // Always pass through salesAgent for natural tone — even if knowledge base has an answer
    const enhancedResponse = await salesAgent(session, userMessage, "general");
    return { type: "text", response: enhancedResponse };
  }


  // ─── CONSULT / FALLBACK: General conversation via salesAgent ───
  const response = await salesAgent(session, userMessage, "general");
  return { type: "text", response };
}

module.exports = agentExecutor;