const callGemini =
  require("../services/gemini");

async function leadExtractor(
  message
) {
  const prompt = `
Extract lead information.

User:
${message}

Return JSON only.

{
 "company":null,
 "industry":null,
 "employees":null,
 "budget":null,
 "timeline":null,
 "goal":null,
 "painPoint":null,
 "service":null
}
`;

  const result =
    await callGemini(prompt);

  try {
    return JSON.parse(result);
  } catch {
    return {};
  }
}

module.exports =
  leadExtractor;