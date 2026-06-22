const calendar =
require("./calendar");


const {
 sendBookingEmail
}=require("./email");



async function bookMeeting({
name,
email,
service,
slot
}){


if(!slot){

throw new Error(
"Slot missing. Please select a slot first."
);

}


// HANDLE ISO SLOT FROM CHATBOT
// Slot arrives as a correct UTC ISO string (e.g. "2026-06-24T05:30:00.000Z" for 11 AM IST)
// Parse it directly — do NOT replace "Z" with "+05:30" as that double-offsets the time
const start =
new Date(slot);


if(isNaN(start.getTime())){

throw new Error(
"Invalid slot time."
);

}



const end =
new Date(start);

end.setMinutes(
end.getMinutes()+30
);



console.log(
"BOOKING SLOT RECEIVED:",
slot
);

console.log(
"START IST:",
start.toLocaleString(
"en-IN",
{
timeZone:"Asia/Kolkata"
}
)
);



const conflictEvents =
await calendar.events.list({

calendarId:
process.env.GOOGLE_CALENDAR_ID,


timeMin:
start.toISOString(),


timeMax:
end.toISOString(),


singleEvents:true

});



const conflict =
conflictEvents.data.items.some(
event=>{

if(!event.start.dateTime)
return false;


return (
start <
new Date(event.end.dateTime)
&&
end >
new Date(event.start.dateTime)
);

});



if(conflict){

const error =
new Error(
"This slot has already been booked. Please choose another time."
);

error.statusCode = 409;

throw error;

}



const event = {


summary:
`Consultation - ${name}`,


description:
`
Email:${email}
Service:${service}
`,


start:{

dateTime:
start.toISOString(),

timeZone:
"Asia/Kolkata"

},


end:{

dateTime:
end.toISOString(),

timeZone:
"Asia/Kolkata"

},


conferenceData:{

createRequest:{

requestId:
"meet-"+Date.now(),

conferenceSolutionKey:{
type:"hangoutsMeet"
}

}

}

};



const response =
await calendar.events.insert({

calendarId:
process.env.GOOGLE_CALENDAR_ID,


resource:event,


conferenceDataVersion:1,
sendUpdates:"all"
});



const meetLink =
response.data.hangoutLink ||
response.data
?.conferenceData
?.entryPoints
?.find(
e =>
e.entryPointType==="video"
)
?.uri;



await sendBookingEmail({

name,
email,
slot,
meetLink

});



return {

success:true,

eventId:
response.data.id,

meetLink

};


}



module.exports =
bookMeeting;