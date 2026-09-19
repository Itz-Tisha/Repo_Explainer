const axios = require("axios");
const User = require("../models/User");

const githubLogin = (req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.GITHUB_CALLBACK_URL}` +
    `&scope=repo%20read:user%20user:email`;

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

const getRepositories = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    // Find user in MongoDB
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check GitHub token
    if (!user.githubAccessToken) {
      return res.status(401).json({
        message: "GitHub access token not found",
      });
    }

    // Get repositories from GitHub
    const response = await axios.get(
      "https://api.github.com/user/repos",
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: "application/vnd.github+json",
        },

        params: {
          visibility: "all",
          affiliation: "owner,collaborator,organization_member",
          per_page: 100,
        },
      }
    );

    // Send repositories to React
    res.json(response.data);
  } catch (error) {
    console.error(
      "Failed to fetch repositories:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to fetch repositories",
    });
  }
};

const getRepositoryFiles = async (req, res) => {
  try {
    // Check login
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    // Get owner and repo from URL
    const { owner, repo } = req.params;

    // Find current user
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.githubAccessToken) {
      return res.status(401).json({
        message: "GitHub access token not found",
      });
    }

    // ------------------------------------------------
    // STEP 1: Get repository information
    // ------------------------------------------------

    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const defaultBranch = repoResponse.data.default_branch;

    // ------------------------------------------------
    // STEP 2: Get repository tree
    // ------------------------------------------------

    const treeResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const tree = treeResponse.data.tree;

    // ------------------------------------------------
    // STEP 3: Get only files
    // ------------------------------------------------

    const allFiles = tree.filter(
      (item) => item.type === "blob"
    );

    console.log("Total files:", allFiles.length);

    // ------------------------------------------------
    // STEP 4: Filter files useful for our project
    // ------------------------------------------------

    const ignoredFolders = [
      "node_modules/",
      ".git/",
      "dist/",
      "build/",
      ".next/",
      "coverage/",
    ];

    const ignoredFiles = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
    ];

    const allowedExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".c",
      ".cpp",
      ".cs",
      ".go",
      ".php",
      ".rb",
      ".html",
      ".css",
      ".scss",
      ".json",
      ".md",
      ".env.example",
      ".yml",
      ".yaml",
      ".xml",
      ".sql",
    ];

    const requiredFiles = allFiles.filter((file) => {
      // Ignore folders
      const insideIgnoredFolder = ignoredFolders.some((folder) =>
        file.path.startsWith(folder)
      );

      if (insideIgnoredFolder) {
        return false;
      }

      // Ignore files
      if (ignoredFiles.includes(file.path)) {
        return false;
      }

      // Check extension
      return allowedExtensions.some((extension) =>
        file.path.endsWith(extension)
      );
    });

    console.log(
      "Required files:",
      requiredFiles.length
    );

    // ------------------------------------------------
    // STEP 5: Get file contents
    // ------------------------------------------------

    const files = [];

    for (const file of requiredFiles) {
      try {
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
          {
            headers: {
              Authorization: `Bearer ${user.githubAccessToken}`,
              Accept: "application/vnd.github+json",
            },
          }
        );

        const fileData = fileResponse.data;

        // GitHub returns base64 encoded content
        const content = Buffer.from(
          fileData.content,
          "base64"
        ).toString("utf-8");

        files.push({
          path: file.path,
          name: file.path.split("/").pop(),
          size: file.size,
          content: content,
        });
      } catch (error) {
        console.log(
          `Could not fetch ${file.path}`
        );
      }
    }

    // ------------------------------------------------
    // STEP 6: Send everything to React
    // ------------------------------------------------

    res.json({
      repository: `${owner}/${repo}`,
      branch: defaultBranch,
      totalFiles: files.length,
      files: files,
    });

  } catch (error) {
    console.error(
      "Repository files error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "Failed to fetch repository files",
    });
  }
};

module.exports = {
  githubLogin,
  githubCallback,
  getCurrentUser,
  getRepositories,
  getRepositoryFiles,
  logout,
};