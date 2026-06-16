const db =
require("../config/database");


async function createConversation(
  sessionId
) {

const result =
await db.query(
`
INSERT INTO conversations(session_id)
VALUES($1)

ON CONFLICT(session_id)
DO UPDATE SET
updated_at = NOW()

RETURNING *
`,
[
sessionId
]
);


return result.rows[0];

}



async function saveMessage({

sessionId,
role,
content

}) {


const conversation =
await createConversation(
sessionId
);


await db.query(
`
INSERT INTO messages(
conversation_id,
role,
content
)
VALUES($1,$2,$3)
`,
[
conversation.id,
role,
content || ""
]
);


}



async function getMessages(
sessionId
){

const result =
await db.query(
`
SELECT
m.role,
m.content

FROM messages m

JOIN conversations c
ON m.conversation_id=c.id

WHERE c.session_id=$1

ORDER BY m.created_at ASC
`,
[
sessionId
]
);


return result.rows;

}



module.exports = {

createConversation,

saveMessage,

getMessages

};