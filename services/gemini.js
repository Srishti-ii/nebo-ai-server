async function callGemini(
  contents
) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        "x-goog-api-key":
          process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "Gemini Error"
    );
  }

  return data;
}

module.exports = {
  callGemini
};