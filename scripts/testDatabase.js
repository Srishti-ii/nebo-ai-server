require("dotenv").config();

const db =
require("../config/database");


async function test(){

try{

const result =
await db.query(
"SELECT NOW()"
);


console.log(
"Database time:",
result.rows[0]
);


process.exit(0);


}catch(error){

console.error(error);

process.exit(1);

}

}


test();