const toolRegistry =
require("./toolRegistry");

async function runTool(
toolName,
params = {}
) {

  const tool =
    toolRegistry[toolName];

  if (!tool) {

    throw new Error(
      `Unknown tool: ${toolName}`
    );
  }

  return await tool(params);
}

async function runTools(
toolNames,
params = {}
) {

  const results = {};

  for (const toolName of toolNames) {

    results[toolName] =
      await runTool(
        toolName,
        params
      );
  }

  return results;
}

module.exports = {
  runTool,
  runTools,
};