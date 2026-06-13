
const {
  getSession,
  saveSession
} = require("../memory/conversationMemory");
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

      const session =
        getSession(
          sessionId
        );

      session.history.push({
        role: "user",

        parts: [
          {
            text: message
          }
        ]
      });

      const result =
  await executeAgent(
    session,
    message
  );
  saveSession(
  sessionId,
  session
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