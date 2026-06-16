const db =
require("../config/database");
async function getLeadBySession(
 sessionId
){

const result =
await db.query(
`
SELECT *
FROM leads
WHERE session_id=$1
`,
[
sessionId
]
);


return result.rows[0] || {};
}

async function saveLead(
{
 sessionId,
 lead
}
){

const result =
await db.query(
`
INSERT INTO leads
(
session_id,
name,
email,
company,
industry,
budget,
timeline,
pain_points,
score,
status,
state
)

VALUES
(
$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
)

ON CONFLICT(session_id)

DO UPDATE SET

name=$2,
email=$3,
company=$4,
industry=$5,
budget=$6,
timeline=$7,
pain_points=$8,
score=$9,
status=$10,
state=$11,
updated_at=NOW()

RETURNING *
`,
[
sessionId,
lead.name,
lead.email,
lead.company,
lead.industry,
lead.budget,
lead.timeline,
lead.painPoint,
lead.score || 0,
lead.status || "cold",
lead.state || null
]
);


return result.rows[0];

}


module.exports = {

saveLead,
getLeadBySession

};