const {
 sendEmail
} = require(
 "../services/email"
);

async function sendFollowUpEmail(
 lead
) {
  return await sendEmail({
    to: lead.email,

    subject:
      "Following up on your AI consultation",

    html: `
      <h2>Hello</h2>

      <p>
      Thank you for your interest in Nebo.
      </p>

      <p>
      If you'd like to discuss your requirements,
      you can book a consultation.
      </p>
    `,
  });
}

module.exports =
sendFollowUpEmail;