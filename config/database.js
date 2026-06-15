const { Pool } =
require("pg");

console.log(
  "DATABASE_URL EXISTS:",
  !!process.env.DATABASE_URL
);

console.log(
  "DATABASE HOST:",
  process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : "missing"
);
const pool =
new Pool({

  connectionString:
    process.env.DATABASE_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized:false
        }
      : false

});


pool.on(
  "connect",
  ()=>{
    console.log(
      "PostgreSQL connected"
    );
  }
);


pool.on(
  "error",
  (error)=>{
    console.error(
      "Database error",
      error
    );
  }
);


module.exports = pool;