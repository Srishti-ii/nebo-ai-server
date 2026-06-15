const fs = require("fs");
const path = require("path");

const db =
require("../config/database");


async function runMigration() {

  const sql =
    fs.readFileSync(
      path.join(
        __dirname,
        "migrations",
        "init.sql"
      ),
      "utf8"
    );


  await db.query(sql);


  console.log(
    "Database migration completed"
  );

}


module.exports =
runMigration;