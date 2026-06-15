const express = require("express");
const cors = require("cors");


const agentRoutes =
require("../routes/agentRoutes");


const bookingRoutes =
require("../routes/bookingRoutes");
const helmet =
require("helmet");

const app = express();
const morgan =
require("morgan");

app.use(
 morgan("combined")
);

app.use(
 express.json()
);

app.use(
 helmet()
);
app.use(
 cors({
  origin:[
   "http://localhost:3000",
   "http://localhost:5173",
   "https://neboengineering.vercel.app"
  ],
  credentials:true
 })
);



app.use(
 "/api",
 agentRoutes
);


app.use(
 "/api",
 bookingRoutes
);



app.get(
 "/",
 (req,res)=>{
  res.json({
   success:true,
   message:
   "Nebo Backend Running"
  });
 }
);
app.get(
"/health",
(req,res)=>{

res.json({
status:"ok"
});

});

const errorHandler =
require("../middleware/errorHandler");

app.use(errorHandler);
module.exports = app;