const calendar =
require("../services/calendar");

const generateSlots =
require("../services/availability");


async function getAvailableSlots() {


  const indiaNow =
    new Date(
      new Date().toLocaleString(
        "en-US",
        {
          timeZone: "Asia/Kolkata"
        }
      )
    );


  const result =
    await calendar.events.list({

      calendarId:
        process.env.GOOGLE_CALENDAR_ID,

timeMin:
  new Date(
    indiaNow.getTime() - (5.5 * 60 * 60 * 1000)
  ).toISOString(),


timeMax:
  new Date(
    indiaNow.getTime() +
    (7 * 24 * 60 * 60 * 1000)
    -
    (5.5 * 60 * 60 * 1000)
  ).toISOString(),


      singleEvents:true,

      orderBy:"startTime"

    });



  const slots =
    generateSlots(
      result.data.items
    );



  const available =
    slots
    .filter(slot => {


      const slotIndia =
        new Date(
          slot.toLocaleString(
            "en-US",
            {
              timeZone:"Asia/Kolkata"
            }
          )
        );


      return slotIndia > indiaNow;

    })

    .slice(0,30);



  return available.map(slot => {


    return {

      // send IST value to frontend/backend
      value:
        slot.toLocaleString(
          "sv-SE",
          {
            timeZone:"Asia/Kolkata"
          }
        ),


      // display value
      label:
        slot.toLocaleString(
          "en-IN",
          {
            timeZone:"Asia/Kolkata",
            dateStyle:"medium",
            timeStyle:"short"
          }
        )

    };


  });


}


module.exports =
getAvailableSlots;