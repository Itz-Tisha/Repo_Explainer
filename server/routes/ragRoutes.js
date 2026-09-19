const express = require("express");

const {
  ingestRepository,
} = require("../controllers/ragController");

const router = express.Router();

router.post(
  "/ingest/:owner/:repo",
  ingestRepository
);

module.exports = router;