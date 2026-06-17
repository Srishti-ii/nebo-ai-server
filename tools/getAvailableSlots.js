const calendar =
require("../services/calendar");

const generateSlots =
require("../services/availability");


async function getAvailableSlots() {


const nowIST =
new Date(
new Date().toLocaleString(
"en-US",
{
timeZone:"Asia/Kolkata"
}
)
);



const result =
await calendar.events.list({

calendarId:
process.env.GOOGLE_CALENDAR_ID,


timeMin:
new Date().toISOString(),


timeMax:
new Date(
Date.now()
+
7*24*60*60*1000
).toISOString(),


singleEvents:true,

orderBy:"startTime"

});



let slots =
generateSlots(
result.data.items
);



const filtered =
slots.filter(slot=>{


const slotIST =
new Date(
slot.toLocaleString(
"en-US",
{
timeZone:"Asia/Kolkata"
}
)
);



const hour =
slotIST.getHours();


// ONLY 10 AM - 5 PM IST

if(
hour < 10 ||
hour >=17
){
return false;
}


// remove past slots

return slotIST > nowIST;


});



return filtered
.slice(0,30)
.map(slot=>{


const ist =
new Date(
slot.toLocaleString(
"en-US",
{
timeZone:"Asia/Kolkata"
}
)
);



return {


value:
slot.toISOString(),


label:
new Intl.DateTimeFormat(
"en-IN",
{
timeZone:"Asia/Kolkata",
dateStyle:"medium",
timeStyle:"short"
}
).format(ist)

};


});


}


module.exports =
getAvailableSlots;