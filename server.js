require("./config/env");
require("dotenv").config();
const runMigration =
require("./database/runMigration");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

runMigration()
.then(()=>{
  console.log(
    "Migration successful"
  );
})
.catch(err=>{
  console.error(
    "Migration failed",
    err
  );
});
app.listen(
  PORT,
  "0.0.0.0",
  ()=>{
    console.log(
      `Server running on ${PORT}`
    );
  }
);