const callGemini =
  require("../services/gemini");

const SYSTEM_PROMPT = `
You are Nebo AI.

You are a senior business consultant from Nebo IT Solutions.

Your responsibilities:

- Understand the client's business
- Recommend AI solutions
- Recommend automation opportunities
- Recommend CRM solutions
- Recommend websites and chatbots
- Qualify leads
- Suggest consultation naturally

Never act like a generic AI assistant.
`;

async function salesAgent(
  session,
  userMessage
) {
  const history =
    session.history
      .map((msg) => {
        if (msg.text)
          return msg.text;

        if (
          msg.parts &&
          msg.parts[0]
        ) {
          return msg.parts[0].text;
        }

        return "";
      })
      .join("\n");

  const prompt = `
${SYSTEM_PROMPT}

Conversation:

${history}

User:
${userMessage}
`;

  return await callGemini(prompt);
}

module.exports =
  salesAgent;