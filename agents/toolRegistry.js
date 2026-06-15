const getAvailableSlots =
  require("../tools/getAvailableSlots");
const bookMeeting =
  require(
    "../tools/bookMeeting"
  );

const sendFollowUpEmail =
  require("../tools/sendFollowUpEmail");

module.exports = {
  getAvailableSlots,
  sendFollowUpEmail,
  bookMeeting

};