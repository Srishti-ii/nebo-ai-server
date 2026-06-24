const {
  GoogleGenerativeAI
} = require("@google/generative-ai");


const genAI =
new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


const model =
genAI.getGenerativeModel({
  model: "gemini-2.5-flash"
});


function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}


async function callGemini(prompt) {

  let lastError;


  for (
    let attempt = 0;
    attempt < 4;
    attempt++
  ) {

    try {

      const result =
        await model.generateContent(
          prompt
        );

      return result.response.text();


    } catch(error) {

      lastError = error;


      const isTemporary =
        error.message.includes("503") ||
        error.message.includes("429");


      if (!isTemporary) {
        throw error;
      }
  await sleep(
 Math.pow(2, attempt) * 3000
);
    }
  }

 console.error(
    "Gemini unavailable:",
    lastError?.message
  );

  return "Sorry, we're unable to connect right now due to a temporary server issue. Please try again in a few moments.";
}

module.exports =
callGemini;