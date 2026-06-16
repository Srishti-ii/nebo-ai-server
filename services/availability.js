function generateSlots(events) {
  const slots = [];

  const today = new Date();

  for (let day = 0; day < 7; day++) {
    const currentDay = new Date(today);
    currentDay.setDate(today.getDate() + day);

    // Skip Sunday
    if (currentDay.getDay() === 0) continue;

    for (let hour = 10; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {

        const slotStart = new Date(currentDay);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        const conflict = events.some(event => {
          if (!event.start?.dateTime || !event.end?.dateTime) {
            return false;
          }

          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);

          return (
            slotStart < eventEnd &&
            slotEnd > eventStart
          );
        });

       const now = new Date();

now.setSeconds(0);
now.setMilliseconds(0);


if(
!conflict &&
slotStart.getTime() > now.getTime()
){
 slots.push(slotStart);
}
      }
    }
  }

  return slots.slice(0, 20);
}

module.exports = generateSlots;