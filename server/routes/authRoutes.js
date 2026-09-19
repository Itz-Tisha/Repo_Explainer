const express = require("express");

const {
  githubLogin,
  githubCallback,
  getCurrentUser,
  getRepositories,
  getRepositoryFiles,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/github", githubLogin);

router.get("/github/callback", githubCallback);

router.get("/me", getCurrentUser);

router.get("/repos", getRepositories);

router.get(
  "/repos/:owner/:repo/files",
  getRepositoryFiles
);

router.get("/logout", logout);

module.exports = router;