function isSlotSelected(
  message
) {
  return (
    message.includes("T") &&
    message.includes("Z")
  );
}

module.exports =
  isSlotSelected;