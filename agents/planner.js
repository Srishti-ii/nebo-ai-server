function planner(
  session,
  message
) {
  const lower =
    message.toLowerCase();

  if (
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(
      message
    )
  ) {
    return {
      action:
        "capture_email",

      email:
        message.match(
          /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
        )[0],
    };
  }

  if (
    lower.includes(
      "consultation"
    ) ||
    lower.includes(
      "schedule"
    ) ||
    lower.includes(
      "book"
    ) ||
    lower.includes(
      "call"
    )
  ) {
    return {
      action:
        "show_slots",
    };
  }

  return {
    action: "consult",
  };
}

module.exports =
  planner;