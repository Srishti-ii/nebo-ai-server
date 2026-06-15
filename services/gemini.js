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
    resolve =>
      setTimeout(resolve, ms)
  );

}



async function callGemini(prompt) {


  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {


    try {


      const result =
        await model.generateContent(
          prompt
        );


      return result.response.text();


    } catch(error) {


      console.error(
        `Gemini attempt ${attempt} failed:`,
        error.message
      );


      if (
        error.message.includes("503") &&
        attempt < 3
      ) {


        await sleep(
          attempt * 3000
        );


        continue;

      }


      throw error;

    }

  }

}



module.exports =
callGemini;