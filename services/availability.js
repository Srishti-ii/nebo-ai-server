function generateSlots(events = []) {

  const slots = [];

  const now =
    new Date(
      new Date().toLocaleString(
        "en-US",
        {
          timeZone:"Asia/Kolkata"
        }
      )
    );


  const startDate =
    new Date(now);


  // generate next 7 days
  for(let day=0; day<7; day++){


    const date =
      new Date(startDate);

    date.setDate(
      startDate.getDate()+day
    );


    // 10 AM IST
    date.setHours(
      10,
      0,
      0,
      0
    );


    // 5 PM IST
    const end =
      new Date(date);

    end.setHours(
      17,
      0,
      0,
      0
    );


    while(date < end){


      // skip already passed slots
      if(date > now){


        const conflict =
          events.some(event=>{


            if(!event.start?.dateTime)
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
              date >= eventStart &&
              date < eventEnd
            );


          });



        if(!conflict){

          slots.push(
            new Date(date)
          );

        }

      }


      // 30 minute slots
      date.setMinutes(
        date.getMinutes()+30
      );

    }

  }


  return slots;

}


module.exports =
generateSlots;