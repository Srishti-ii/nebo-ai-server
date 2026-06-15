require("dotenv").config();

const memory =
require("../memory/memoryService");


async function test(){


await memory.saveMessage({

sessionId:"test-session",

role:"user",

content:"I need AI automation"

});


const messages =
await memory.getMessages(
"test-session"
);


console.log(messages);


process.exit(0);


}


test();