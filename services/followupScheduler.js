const sendFollowupEmail =
require(
  "../../tools/sendFollowupEmailail"
);

const {
  getAllSessions,
} = require(
  "../agents/memory"
);

async function runFollowups() {

  const sessions =
    getAllSessions();

  const now =
    Date.now();

  for (
    const session of sessions
  ) {

    if (
      !session.booking?.email
    ) {
      continue;
    }

    const createdAt =
      session.createdAt;

    const age =
      now - createdAt;

    const day1 =
      24 * 60 * 60 * 1000;

    const day3 =
      3 * day1;

    const day7 =
      7 * day1;

    if (
      age >= day1 &&
      !session.followups.day1
    ) {

      await sendFollowupEmail({
        email:
          session.booking.email,

        name:
          session.booking.name ||
          "there",

        stage:
          "day1",
      });

      session.followups.day1 =
        true;
    }

    if (
      age >= day3 &&
      !session.followups.day3
    ) {

      await sendFollowupEmail({
        email:
          session.booking.email,

        name:
          session.booking.name ||
          "there",

        stage:
          "day3",
      });

      session.followups.day3 =
        true;
    }

    if (
      age >= day7 &&
      !session.followups.day7
    ) {

      await sendFollowupEmail({
        email:
          session.booking.email,

        name:
          session.booking.name ||
          "there",

        stage:
          "day7",
      });

      session.followups.day7 =
        true;
    }
  }
}

module.exports =
runFollowups;