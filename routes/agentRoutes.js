const express =
  require("express");

const router =
  express.Router();

const {
  chatWithAgent
} = require(
  "../controllers/agentController"
);

router.post(
  "/agent-chat",
  chatWithAgent
);

module.exports = router;