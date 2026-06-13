async function bookMeeting(
  bookingData
) {console.log(
  "BOOKING URL:",
  `${process.env.BASE_URL}/book-meeting`
);
  const response = await fetch(
    `${process.env.BASE_URL}/book-meeting`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        bookingData
      ),
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Booking failed"
    );
  }

  return data;
}

module.exports =
  bookMeeting;