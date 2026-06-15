
const memory =
require("../memory/memoryService");
const executeAgent =
  require(
    "../agents/agentExecutor"
  );
  const bookingService =
require("../services/bookingService");
exports.chatWithAgent =
  async (req, res) => {
    try {
      const {
        sessionId,
        message
      } = req.body;

    let history =
await memory.getMessages(
  sessionId
);
const session = {

history:
history.map(msg => ({
  role:
    msg.role === "assistant"
      ? "model"
      : msg.role,

  parts:[
    {
      text:msg.content
    }
  ]
})),

lead:{},

booking:{}

};
      await memory.saveMessage({

sessionId,

role:"user",

content:message

});

      const result =
  await executeAgent(
    session,
    message
  );

      if (
        result.type ===
        "text"
      ) {
        session.history.push({
          role: "model",

          parts: [
            {
              text:
                result.response
            }
          ]
        });
      }
await memory.saveMessage({

sessionId,

role:"assistant",

content:
result.response

});
      res.json(result);
    } catch (error) {
      console.error(
        error
      );

      res.status(500).json({
        success: false,
        error:
          error.message
      });
    }
  };