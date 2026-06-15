
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


const start =
new Date(slot);


const end =
new Date(start);


end.setMinutes(
end.getMinutes()+30
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

const error = new Error(
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
extendedProperties:{
 private:{
  reminderSent:"false"
 }
},

conferenceData:{
createRequest:{
requestId:
Date.now().toString()
}
}


};



const response =
await calendar.events.insert({

calendarId:
process.env.GOOGLE_CALENDAR_ID,


resource:event,


conferenceDataVersion:1

});



const meetLink =
response.data.hangoutLink ||
response.data
?.conferenceData
?.entryPoints
?.find(
 entry =>
 entry.entryPointType === "video"
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