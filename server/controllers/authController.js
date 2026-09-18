const axios = require("axios");
const User = require("../models/User");

const githubLogin = (req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.GITHUB_CALLBACK_URL}` +
    `&scope=read:user user:email`;

  res.redirect(githubAuthUrl);
};

const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("GitHub authorization code missing");
    }

    // Step 1: Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

   console.log("GitHub token response:", tokenResponse.data);

const accessToken = tokenResponse.data.access_token;

if (!accessToken) {
  return res.status(400).json({
    message: "Failed to get GitHub access token",
    githubResponse: tokenResponse.data,
  });
}

    // Step 2: Get GitHub user
    const userResponse = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const githubUser = userResponse.data;

    // Step 3: Find existing user
    let user = await User.findOne({
      githubId: String(githubUser.id),
    });

    // Step 4: Create user if doesn't exist
    if (!user) {
      user = await User.create({
        githubId: String(githubUser.id),
        username: githubUser.login,
        displayName: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
      });
    } else {
      // Update token and information
      user.username = githubUser.login;
      user.displayName = githubUser.name;
      user.avatarUrl = githubUser.avatar_url;
      user.githubAccessToken = accessToken;

      await user.save();
    }

    // Step 5: Save user ID in session
    req.session.userId = user._id.toString();

    // Step 6: Redirect to React
    res.redirect(`${process.env.CLIENT_URL}/home`);
  } catch (error) {
    console.error(
      "GitHub authentication error:",
      error.response?.data || error.message
    );

    res.status(500).send("GitHub authentication failed");
  }
};

const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    const user = await User.findById(req.session.userId).select(
      "-githubAccessToken"
    );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get user",
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.json({
      message: "Logged out successfully",
    });
  });
};

module.exports = {
  githubLogin,
  githubCallback,
  getCurrentUser,
  logout,
};