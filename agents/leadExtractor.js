const callGemini =
  require("../services/gemini");

async function leadExtractor(
  session,
  message
) {

  const prompt = `
You are a lead extraction engine.

Current Lead:

${JSON.stringify(
  session.lead,
  null,
  2
)}

User Message:

${message}

Extract any NEW information.

Return ONLY JSON.

{
  "company": null,
  "industry": null,
  "employees": null,
  "budget": null,
  "timeline": null,
  "goal": null,
  "painPoint": null,
  "service": null
}
`;

  const result =
    await callGemini(prompt);

  console.log(
    "RAW LEAD:",
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
      "LEAD PARSE ERROR:",
      err
    );

    return {};
  }
}

module.exports =
  leadExtractor;