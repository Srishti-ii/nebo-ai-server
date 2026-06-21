const { Resend } = require("resend");

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const FROM_EMAIL =
  "Nebo IT Solutions <contact@neboengineering.in>";

async function sendBookingEmail({
  name,
  email,
  slot,
  meetLink
}) {
  try {

    const result =
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Consultation is Confirmed",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          ">

            <h2>
              Consultation Confirmed
            </h2>

            <p>Hello ${name},</p>

            <p>
              Your consultation has been successfully booked.
            </p>

            <p>
              <strong>Date & Time:</strong><br>
             ${new Date(slot).toLocaleString(
"en-IN",
{
 timeZone:"Asia/Kolkata",
 dateStyle:"medium",
 timeStyle:"short"
}
)}
            </p>

            <p>
              <strong>Google Meet:</strong><br>
              <a href="${meetLink}">
                Join Meeting
              </a>
            </p>

            <p>
              Regards,<br>
              Nebo IT Solutions
            </p>

            <p>
              Website:
              <a href="https://neboengineering.in">
                neboengineering.in
              </a>
            </p>

          </div>
        `
      });

    console.log("================================");
    console.log("BOOKING EMAIL SUCCESS");
    console.log("Recipient:", email);
    console.log("Meeting:", slot);
    console.log("Response:", result);
    console.log("================================");

    if (result.error) {
    console.error("BOOKING EMAIL FAILED:", result.error);

  return {
    success: false,
    error: result.error
  };
}

return {
  success: true,
  result
};

  } catch (error) {

    console.error("================================");
    console.error("BOOKING EMAIL FAILED");
    console.error("Recipient:", email);
    console.error("Meeting:", slot);
    console.error(error);
    console.error("================================");

    return {
      success: false,
      error: error.message
    };
  }
}

async function sendReminderEmail({
  name,
  email,
  slot,
  meetLink
}) {
  try {

    const result =
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject:
          "Reminder: Your Consultation Starts In 1 Hour",

        html: `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
          ">

            <h2>
              Consultation Reminder
            </h2>

            <p>Hello ${name},</p>

            <p>
              This is a reminder that your consultation
              starts soon.
            </p>

            <p>
              <strong>Date & Time:</strong><br>
              ${new Date(slot).toLocaleString(
"en-IN",
{
 timeZone:"Asia/Kolkata",
 dateStyle:"medium",
 timeStyle:"short"
}
)}
            </p>

            <p>
              <strong>Google Meet:</strong><br>
              <a href="${meetLink}">
                Join Meeting
              </a>
            </p>

            <p>
              Regards,<br>
              Nebo IT Solutions
            </p>

            <p>
              Website:
              <a href="https://neboengineering.in">
                neboengineering.in
              </a>
            </p>

          </div>
        `
      });

    console.log("================================");
    console.log("REMINDER EMAIL SUCCESS");
    console.log("Recipient:", email);
    console.log("Meeting:", slot);
    console.log("Response:", result);
    console.log("================================");

   if (result.error) {

    console.error("REMINDER EMAIL FAILED:", result.error);


  return {
    success: false,
    error: result.error
  };
}

return {
  success: true,
  result
};

  } catch (error) {

    console.error("================================");
    console.error("REMINDER EMAIL FAILED");
    console.error("Recipient:", email);
    console.error("Meeting:", slot);
    console.error(error);
    console.error("================================");

    return {
      success: false,
      error: error.message
    };
  }
}
async function sendRescheduleEmail({
  name,
  email,
  oldSlot,
  newSlot,
  meetLink
}) {
  try {
    const oldTime = new Date(oldSlot).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });
    const newTime = new Date(newSlot).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your Consultation Has Been Rescheduled",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        ">
          <h2>Consultation Rescheduled</h2>
          <p>Hello ${name},</p>
          <p>Your consultation has been rescheduled successfully.</p>
          <p>
            <strong>Previous Time:</strong><br>
            <s>${oldTime}</s>
          </p>
          <p>
            <strong>New Date & Time:</strong><br>
            ${newTime}
          </p>
          <p>
            <strong>Google Meet:</strong><br>
            <a href="${meetLink}">Join Meeting</a>
          </p>
          <p>
            Regards,<br>
            Nebo IT Solutions
          </p>
          <p>
            Website:
            <a href="https://neboengineering.in">neboengineering.in</a>
          </p>
        </div>
      `
    });

    console.log("================================");
    console.log("RESCHEDULE EMAIL SUCCESS");
    console.log("Recipient:", email);
    console.log("Old slot:", oldSlot, "New slot:", newSlot);
    console.log("Response:", result);
    console.log("================================");

    if (result.error) {
      console.error("RESCHEDULE EMAIL FAILED:", result.error);
      return { success: false, error: result.error };
    }
    return { success: true, result };
  } catch (error) {
    console.error("================================");
    console.error("RESCHEDULE EMAIL FAILED");
    console.error("Recipient:", email);
    console.error(error);
    console.error("================================");
    return { success: false, error: error.message };
  }
}

async function sendCancellationEmail({
  name,
  email,
  slot
}) {
  try {
    const slotTime = new Date(slot).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your Consultation Has Been Cancelled",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
        ">
          <h2>Consultation Cancelled</h2>
          <p>Hello ${name},</p>
          <p>Your consultation scheduled for <strong>${slotTime}</strong> has been cancelled.</p>
          <p>If you'd like to book a new consultation, feel free to visit our website and chat with us anytime.</p>
          <p>
            Regards,<br>
            Nebo IT Solutions
          </p>
          <p>
            Website:
            <a href="https://neboengineering.in">neboengineering.in</a>
          </p>
        </div>
      `
    });

    console.log("================================");
    console.log("CANCELLATION EMAIL SUCCESS");
    console.log("Recipient:", email);
    console.log("Cancelled slot:", slot);
    console.log("Response:", result);
    console.log("================================");

    if (result.error) {
      console.error("CANCELLATION EMAIL FAILED:", result.error);
      return { success: false, error: result.error };
    }
    return { success: true, result };
  } catch (error) {
    console.error("================================");
    console.error("CANCELLATION EMAIL FAILED");
    console.error("Recipient:", email);
    console.error(error);
    console.error("================================");
    return { success: false, error: error.message };
  }
}

module.exports = {
  resend,
  sendBookingEmail,
  sendReminderEmail,
  sendRescheduleEmail,
  sendCancellationEmail
};