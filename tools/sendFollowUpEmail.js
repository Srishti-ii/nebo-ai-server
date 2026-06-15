const { resend } =
require("../src/services/email");

async function sendFollowupEmail({
  email,
  name,
  stage,
}) {

  let subject;
  let html;

  switch (stage) {

    case "day1":

      subject =
        "Following up on your AI project";

      html = `
      <p>Hi ${name},</p>

      <p>
      Just checking whether you had any
      questions about the AI solutions
      we discussed.
      </p>

      <p>
      We'd be happy to help.
      </p>

      <p>
      Regards,<br/>
      Nebo IT Solutions
      </p>
      `;
      break;

    case "day3":

      subject =
        "Still exploring AI automation?";

      html = `
      <p>Hi ${name},</p>

      <p>
      We wanted to follow up and see
      if you're still exploring AI
      automation for your business.
      </p>

      <p>
      Let us know if you'd like to
      schedule another discussion.
      </p>

      <p>
      Regards,<br/>
      Nebo IT Solutions
      </p>
      `;
      break;

    case "day7":

      subject =
        "Final follow-up";

      html = `
      <p>Hi ${name},</p>

      <p>
      This will be our final follow-up.
      </p>

      <p>
      Whenever you're ready to revisit
      your project, we'd love to help.
      </p>

      <p>
      Regards,<br/>
      Nebo IT Solutions
      </p>
      `;
      break;

    default:
      return;
  }

  return await resend.emails.send({
    from:
      process.env.FROM_EMAIL,

    to: email,

    subject,

    html,
  });
}

module.exports =
sendFollowupEmail;