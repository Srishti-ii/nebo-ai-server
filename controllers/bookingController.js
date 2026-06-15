const bookMeeting =
require("../services/bookingService");


async function createBooking(
 req,
 res
){

try{

const result =
await bookMeeting(
 req.body
);


res.json(result);


}catch(error){

res
.status(error.statusCode || 500)
.json({
 success:false,
 error:error.message
});

}

}


module.exports={
 createBooking
}