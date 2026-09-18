const express = require("express");

const {
  githubLogin,
  githubCallback,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

const router = express.Router();

router.get("/github", githubLogin);

router.get("/github/callback", githubCallback);

router.get("/me", getCurrentUser);

router.get("/logout", logout);

module.exports = router;