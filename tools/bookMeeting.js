const bookingService =
require("../services/bookingService");


async function bookMeeting(
 bookingData
){

return await bookingService(
 bookingData
);

}


module.exports =
bookMeeting;