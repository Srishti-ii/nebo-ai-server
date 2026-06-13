const tools =
require("./toolRegistry");

async function runTools(
toolCalls
) {
  const results = [];

  for (
    const call of toolCalls
  ) {
    const tool =
      tools[call.name];

    if (!tool)
      continue;

    const result =
      await tool(
        call.payload
      );

    results.push({
      tool:
        call.name,

      result,
    });
  }

  return results;
}

module.exports =
runTools;