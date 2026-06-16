
const memory =
require("../memory/memoryService");
const executeAgent =
  require(
    "../agents/agentExecutor"
  );
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
const leadRepository =
require("../database/leadRepository");


const existingLead =
await leadRepository.getLeadBySession(
  sessionId
);


const session = {

sessionId,

state:
existingLead?.state || null,

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


lead:
existingLead || {},


booking:
existingLead.booking || {}

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
result.response ||
JSON.stringify(result)

});
      res.json(result);
    } catch (error) {

  console.error(
    "AGENT ERROR FULL:",
    error
  );

  console.error(
    "STACK:",
    error.stack
  );

  res.status(500).json({

    success:false,

    error:
      error.message ||
      JSON.stringify(error)

  });

}
  };