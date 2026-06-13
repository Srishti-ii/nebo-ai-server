const getAvailableSlots =
require("../tools/getAvailableSlots");

const bookConsultation =
require("../tools/bookConsultation");

async function executeAction(
  action,
  payload
) {

  switch (action) {

    case "GET_SLOTS":

      return await getAvailableSlots();

    case "BOOK":

      return await bookConsultation(
        payload
      );

    default:

      return null;
  }
}

module.exports = {
  executeAction
};