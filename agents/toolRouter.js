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
tools,
params = {}
) {

  const results = {};


  for (const tool of tools) {


    const toolName =
      typeof tool === "string"
        ? tool
        : tool.name;


    const toolParams =
      typeof tool === "object" &&
      tool.payload
        ? tool.payload
        : params;


    results[toolName] =
      await runTool(
        toolName,
        toolParams
      );

  }


  return results;

}


module.exports = {
  runTool,
  runTools,
};