const express = require("express");
const { createBooking } = require("../controllers/bookingController");

const router = express.Router();

router.post("/book", createBooking);

module.exports = router;