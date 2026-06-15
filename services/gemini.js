const {
  GoogleGenerativeAI
} = require("@google/generative-ai");


const genAI =
new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


const models = [
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];


async function callGemini(prompt) {

  let lastError;


  for (const modelName of models) {

    try {

      const model =
        genAI.getGenerativeModel({
          model: modelName
        });


      const result =
        await model.generateContent(
          prompt
        );


      return result.response.text();


    } catch(error) {

      lastError = error;

      console.log(
        `Gemini failed on ${modelName}`,
        error.message
      );


      if (
        error.message.includes("503")
      ) {

        await new Promise(
          r =>
          setTimeout(r,3000)
        );

        continue;
      }


      throw error;
    }
  }


  throw lastError;
}


module.exports =
callGemini;