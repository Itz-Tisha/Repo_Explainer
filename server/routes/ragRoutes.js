const express = require("express");

const {
  ingestRepository,
  askQuestion,
} = require("../controllers/ragController");

const router = express.Router();

// -----------------------------------------
// Process repository
// -----------------------------------------

router.post(
  "/ingest/:owner/:repo",
  ingestRepository
);

// -----------------------------------------
// Ask question
// -----------------------------------------

router.post(
  "/ask/:owner/:repo",
  askQuestion
);

module.exports = router;