const services =
require("../knowledge/services.json");

const faq =
require("../knowledge/faq.json");

function knowledgeAgent(
  question
) {
  const lower =
    question.toLowerCase();

  for (
    const item of faq
  ) {
    if (
      lower.includes(
        item.question
          .toLowerCase()
          .replace(
            "?",
            ""
          )
      )
    ) {
      return item.answer;
    }
  }

  if (
    lower.includes(
      "chatbot"
    )
  ) {
    return services.chatbot
      .description;
  }

  if (
    lower.includes(
      "website"
    )
  ) {
    return services.website
      .description;
  }

  if (
    lower.includes("crm")
  ) {
    return services.crm
      .description;
  }

  return null;
}

module.exports =
  knowledgeAgent;