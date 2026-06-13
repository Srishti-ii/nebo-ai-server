const {
  callGemini
} = require(
  "../services/gemini"
);

const {
  SYSTEM_PROMPT
} = require(
  "../agents/salesAgent"
);

const {
  getConversation,
  saveConversation
} = require(
  "../memory/conversationMemory"
);

exports.chatWithAgent =
  async (req, res) => {
    console.log(
  "REQ BODY:",
  req.body
);
    try {
      const {
        sessionId,
        message
      } = req.body || {};
if (
      !sessionId ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        error:
          "sessionId and message are required"
      });
    }
      const conversation =
        getConversation(
          sessionId
        );

      conversation.history.push({
        role: "user",
        text: message
      });

      const prompt = [
        {
          role: "user",
          parts: [
            {
              text:
                SYSTEM_PROMPT +
                "\n\nConversation:\n" +
                JSON.stringify(
                  conversation.history
                ) +
                "\n\nUser: " +
                message
            }
          ]
        }
      ];

      const result =
        await callGemini(
          prompt
        );

      const reply =
        result.candidates?.[0]
          ?.content?.parts?.[0]
          ?.text ||
        "Sorry, I couldn't process that.";
const tools =
require("../agents/toolRegistry");
if (
  reply.trim() ===
  "GET_AVAILABLE_SLOTS"
) {

  const slots =
    await tools
      .getAvailableSlots();

  return res.json({
    success: true,

    action:
      "show_slots",

    slots,
  });
}if (
  reply.trim() ===
  "BOOK_CONSULTATION"
) {

  return res.json({
    success: true,

    action:
      "collect_booking_details",
  });
}
      conversation.history.push({
        role: "assistant",
        text: reply
      });

      saveConversation(
        sessionId,
        conversation
      );

      res.json({
        success: true,
        reply
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error:
          error.message
      });
    }
  };