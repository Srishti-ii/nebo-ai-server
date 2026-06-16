const callGemini =
  require("../services/gemini");


async function leadExtractor(
  session,
  message
) {


const lastAssistantMessage =
session.history
?.filter(
 m => m.role === "model"
)
?.slice(-1)[0]
?.parts?.[0]?.text || "";



const prompt = `

You are a lead extraction engine.

Your job is to extract lead information
from the user message.

Current Lead:

${JSON.stringify(
session.lead,
null,
2
)}


Previous Assistant Question:

${lastAssistantMessage}


Current User Message:

${message}


Rules:

1. If the assistant asked:
"What does your company do?"
or similar,
then short answers like:

"IT services"
"law firm"
"logistics"
"agency"
"software company"

must be extracted as:

industry


2. If user gives a number like:
"1 lakh"
"$3000"
"5000 dollars"

extract:

budget


3. If user gives:
"1 month"
"2 months"
"within a month"

extract:

timeline


4. Never extract these as service:

book
booking
consultation
meeting
call
schedule


Return ONLY JSON.

Format:

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



console.log(
"RAW LEAD:",
result
);



try {

const cleaned =
result
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();


return JSON.parse(cleaned);


}
catch(err){

console.log(
"LEAD PARSE ERROR:",
err
);


return {};

}

}


module.exports =
leadExtractor;