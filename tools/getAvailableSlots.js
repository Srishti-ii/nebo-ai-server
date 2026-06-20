const calendar =
require("../services/calendar");
const generateSlots =
require("../services/availability");
async function getAvailableSlots() {
// IST offset: +5 hours 30 minutes in ms
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const nowUTC = Date.now();
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
// Get IST hour from the UTC timestamp
const istTime =
new Date(slot.getTime() + IST_OFFSET);

const hour =

istTime.getUTCHours();
// ONLY 10 AM - 5 PM IST
if(
hour < 10 ||
hour >=17
){
return false;
}

return slot.getTime() > nowUTC;
});
return filtered
.slice(0,30)
.map(slot=>{

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
).format(slot)
};
});
}
module.exports =
getAvailableSlots;
getAvailableSlots;