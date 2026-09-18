const express = require("express");

const {
  githubLogin,
  githubCallback,
  getCurrentUser,
  getRepositories,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/github", githubLogin);

router.get("/github/callback", githubCallback);

router.get("/me", getCurrentUser);

router.get("/repos", getRepositories);

router.get("/logout", logout);

module.exports = router;