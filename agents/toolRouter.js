const tools =
  require("./toolRegistry");

async function runTool(
  toolName,
  payload
) {
  const tool =
    tools[toolName];

  if (!tool) {
    throw new Error(
      `Tool not found: ${toolName}`
    );
  }

  return await tool(payload);
}

module.exports =
  runTool;