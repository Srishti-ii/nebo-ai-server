function generateSlots(events) {

const slots=[];

const now = new Date();

const indiaNow = new Date(
 now.toLocaleString(
  "en-US",
  {
   timeZone:"Asia/Kolkata"
  }
 )
);


for(let day=0; day<7; day++){

const currentDay =
new Date(indiaNow);


currentDay.setDate(
 indiaNow.getDate()+day
);


// skip sunday
if(currentDay.getDay()===0)
continue;



for(
let hour=10;
hour<18;
hour++
){

for(
let minute=0;
minute<60;
minute+=30
){


const slotStart =
new Date(
 currentDay
);


slotStart.setHours(
hour,
minute,
0,
0
);


const indiaTime = new Date(
 slotStart.toLocaleString(
  "en-US",
  {
   timeZone:"Asia/Kolkata"
  }
 )
);

const currentIndiaTime = new Date(
 indiaNow.toLocaleString(
  "en-US",
  {
   timeZone:"Asia/Kolkata"
  }
 )
);


if(indiaTime.getTime() <= currentIndiaTime.getTime()){
 continue;
}



const slotEnd =
new Date(slotStart);


slotEnd.setMinutes(
slotEnd.getMinutes()+30
);



const conflict =
events.some(event=>{

if(!event.start?.dateTime)
return false;


const start =
new Date(
event.start.dateTime
);

const end =
new Date(
event.end.dateTime
);


return (
slotStart < end &&
slotEnd > start
);

});



if(!conflict)
slots.push(slotStart);

}

}

}


return slots.slice(0,10);

}


module.exports=generateSlots;