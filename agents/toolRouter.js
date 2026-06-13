const tools =
require("./toolRegistry");

async function routeTool(
  action,
  args
) {

  switch(action) {

    case "getAvailableSlots":
      return await tools
        .getAvailableSlots();

    case "bookConsultation":
      return await tools
        .bookConsultation(args);

    case "sendFollowupEmail":
      return await tools
        .sendFollowupEmail(args);

    default:
      return null;
  }
}

module.exports = {
  routeTool
};