const getAvailableSlots =
  require("../tools/getAvailableSlots");
const bookMeeting =
  require(
    "../tools/bookMeeting"
  );
const bookConsultation =
  require("../tools/bookConsultation");

const sendFollowUpEmail =
  require("../tools/sendFollowUpEmail");

module.exports = {
  getAvailableSlots,
  bookConsultation,
  sendFollowUpEmail,
  bookMeeting

};