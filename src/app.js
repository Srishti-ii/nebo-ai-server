const express = require("express");
const cors = require("cors");


const agentRoutes =
require("../routes/agentRoutes");


const bookingRoutes =
require("../routes/bookingRoutes");


const app = express();


app.use(
 express.json()
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



module.exports = app;