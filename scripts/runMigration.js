require("dotenv").config();

const fs = require("fs");

const db =
require("../config/database");


async function migrate(){

const sql =
fs.readFileSync(
"database/migrations/init.sql",
"utf8"
);


try{

await db.query(sql);

console.log(
"Database tables created"
);


process.exit(0);


}catch(error){

console.error(error);

process.exit(1);

}

}


migrate();