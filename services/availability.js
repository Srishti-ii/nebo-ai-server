function generateSlots(events=[]){

const slots=[];

// IST offset: +5 hours 30 minutes in ms
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// Current time in UTC
const nowUTC = Date.now();

// Get today's date in IST
const nowIST = new Date(nowUTC + IST_OFFSET);
const todayIST = {
 year: nowIST.getUTCFullYear(),
 month: nowIST.getUTCMonth(),
 date: nowIST.getUTCDate(),
 hours: nowIST.getUTCHours(),
 minutes: nowIST.getUTCMinutes()
};


for(let i=0;i<7;i++){

for(
let hour=10;
hour<17;
hour++
){

for(
let minute of [0,30]
){

// Build the IST time, then convert to UTC for the Date object
// IST time = UTC + 5:30, so UTC = IST - 5:30
const istDate = new Date(Date.UTC(
 todayIST.year,
 todayIST.month,
 todayIST.date + i,
 hour - 5,
 minute - 30,
 0,
 0
));


// Skip past slots
if(
istDate.getTime() <= nowUTC
)
continue;



const conflict =
events.some(event=>{

if(!event.start.dateTime)
return false;


const eventStart =
new Date(
event.start.dateTime
);

const eventEnd =
new Date(
event.end.dateTime
);


return (
istDate >= eventStart &&
istDate < eventEnd
);

});


if(!conflict){

slots.push(istDate);

}

}

}

}


return slots.slice(0,30);

}


module.exports =
generateSlots;