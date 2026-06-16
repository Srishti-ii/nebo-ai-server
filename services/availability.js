function generateSlots(events=[]){

const slots=[];


const now = new Date();


const startDate = new Date();


startDate.setHours(
10,
0,
0,
0
);


for(let i=0;i<7;i++){

const day =
new Date(startDate);


day.setDate(
startDate.getDate()+i
);


for(
let hour=10;
hour<=16;
hour++
){

for(
let minute of [0,30]
){


const slot =
new Date(day);


slot.setHours(
hour,
minute,
0,
0
);


// skip past time today

if(
slot <= now
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
slot >= eventStart &&
slot < eventEnd
);

});


if(!conflict){

slots.push(slot);

}

}

}

}


return slots.slice(0,10);

}


module.exports =
generateSlots;