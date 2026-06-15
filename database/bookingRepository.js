const db =
require("../config/database");


async function saveBooking({
  sessionId,
  leadId,
  name,
  email,
  service,
  slot,
  meetLink,
  eventId
}) {


const result =
await db.query(
`
INSERT INTO bookings
(
session_id,
lead_id,
name,
email,
service,
slot,
meet_link,
event_id,
status
)

VALUES
(
$1,$2,$3,$4,$5,$6,$7,$8,$9
)

RETURNING *
`,
[
sessionId,
leadId,
name,
email,
service,
slot,
meetLink,
eventId,
"confirmed"
]
);


return result.rows[0];

}



module.exports =
{
 saveBooking
};