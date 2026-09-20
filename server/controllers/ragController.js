const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
const Embedding = require("../models/Embedding");

const { createEmbedding } = require("../services/embeddingService");
const { chunkText } = require("../services/chunkService");

const ingestRepository = async (req, res) => {
  try {
    // ----------------------------------
    // 1. Check login
    // ----------------------------------

    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    const { owner, repo } = req.params;

    // ----------------------------------
    // 2. Find user
    // ----------------------------------

    const user = await User.findById(
      req.session.userId
    );

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

    // ----------------------------------
    // 3. Get repository information
    // ----------------------------------

    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const defaultBranch =
      repoResponse.data.default_branch;

    // ----------------------------------
    // 4. Get repository tree
    // ----------------------------------

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

    // ----------------------------------
    // 5. Select useful files
    // ----------------------------------

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
      ".yml",
      ".yaml",
      ".xml",
      ".sql",
    ];

    const ignoredFolders = [
      "node_modules/",
      ".git/",
      "dist/",
      "build/",
      ".next/",
      "coverage/",
    ];

    const files = tree.filter((item) => {
      if (item.type !== "blob") {
        return false;
      }

      const ignored = ignoredFolders.some((folder) =>
        item.path.startsWith(folder)
      );

      if (ignored) {
        return false;
      }

      return allowedExtensions.some((extension) =>
        item.path.endsWith(extension)
      );
    });

    console.log(
      `Found ${files.length} useful files`
    );

    // ----------------------------------
    // 6. Delete old embeddings
    // ----------------------------------

    await Embedding.deleteMany({
      userId: user._id,
      repository: `${owner}/${repo}`,
    });

    // ----------------------------------
    // 7. Process every file
    // ----------------------------------

    let totalChunks = 0;

    for (const file of files) {
      try {
        // Get file content
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

        // GitHub content is Base64 encoded
        const content = Buffer.from(
          fileData.content,
          "base64"
        ).toString("utf-8");

        // ----------------------------------
        // 8. Chunk file
        // ----------------------------------

        const chunks = chunkText(content);

        console.log(
          `${file.path} → ${chunks.length} chunks`
        );

        // ----------------------------------
        // 9. Create embedding for each chunk
        // ----------------------------------

        for (
          let i = 0;
          i < chunks.length;
          i++
        ) {
          const chunk = chunks[i];

          const embedding =
            await createEmbedding(chunk);

          // ----------------------------------
          // 10. Store in MongoDB
          // ----------------------------------

          await Embedding.create({
            userId: user._id,

            repository: `${owner}/${repo}`,

            filePath: file.path,

            chunkIndex: i,

            content: chunk,

            embedding: embedding,
          });

          totalChunks++;
        }
      } catch (error) {
        console.log(
          `Failed to process ${file.path}:`,
          error.message
        );
      }
    }

    res.json({
      message:
        "Repository successfully embedded",
      repository: `${owner}/${repo}`,
      filesProcessed: files.length,
      chunksStored: totalChunks,
    });
  } catch (error) {
    console.error(
      "Repository ingestion error:",
      error.response?.data ||
        error.message
    );

    res.status(500).json({
      message:
        "Failed to embed repository",
    });
  }
};

// -----------------------------------------
// Ask Question
// -----------------------------------------

const askQuestion = async (req, res) => {
  try {
    // -----------------------------------------
    // Check login
    // -----------------------------------------

    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not logged in",
      });
    }

    // -----------------------------------------
    // Get parameters
    // -----------------------------------------

    const { owner, repo } = req.params;

    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    // -----------------------------------------
    // Find user
    // -----------------------------------------

    const user = await User.findById(
      req.session.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // -----------------------------------------
    // Create embedding for question
    // -----------------------------------------

    console.log(
      "Creating embedding for question..."
    );

    const questionEmbedding =
      await createEmbedding(question);

    console.log(
      "Question embedding created"
    );

    // -----------------------------------------
    // Search MongoDB Vector Search
    // -----------------------------------------

    const repository =
      `${owner}/${repo}`;

    // -----------------------------------------
// Create embedding for question
// -----------------------------------------

console.log(
  "Creating embedding for question..."
);


console.log(
  "Question embedding created"
);

// -----------------------------------------
// Check stored chunks
// -----------------------------------------

const storedChunks =
  await Embedding.countDocuments({
    userId: user._id,
    repository: repository,
  });

console.log(
  "Chunks found in MongoDB for this user/repository:",
  storedChunks
);

// -----------------------------------------
// Search MongoDB Vector Search
// -----------------------------------------

console.log(
  "Searching relevant chunks..."
);

    // const results =
    //   await Embedding.aggregate([
    //     {
    //       $vectorSearch: {
    //         index: "vector_index",

    //         path: "embedding",

    //         queryVector:
    //           questionEmbedding,

    //         numCandidates: 100,

    //         limit: 5,

    //         // filter: {
    //         //   userId:
    //         //     new mongoose.Types.ObjectId(
    //         //       user._id
    //         //     ),

    //         //   repository: repository,
    //         // },
    //       },
    //     },

    //     {
    //       $project: {
    //         _id: 0,

    //         content: 1,

    //         filePath: 1,

    //         chunkIndex: 1,

    //         score: {
    //           $meta:
    //             "vectorSearchScore",
    //         },
    //       },
    //     },
    //   ]);
    const results = await Embedding.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: questionEmbedding,
      numCandidates: 100,
      limit: 5,

      filter: {
        userId: new mongoose.Types.ObjectId(user._id),
        repository: repository,
      },
    },
  },
  {
    $project: {
      _id: 0,
      content: 1,
      filePath: 1,
      chunkIndex: 1,
      repository: 1,
      userId: 1,
      score: {
        $meta: "vectorSearchScore",
      },
    },
  },
]);

    console.log(
      `Found ${results.length} relevant chunks`
    );

    // -----------------------------------------
    // Check if chunks were found
    // -----------------------------------------

    if (results.length === 0) {
      return res.json({
        answer:
          "I could not find relevant information in this repository.",
        sources: [],
      });
    }

    // -----------------------------------------
    // Create context
    // -----------------------------------------

    const context = results
      .map((result, index) => {
        return `
--- Source ${index + 1} ---
File: ${result.filePath}
Chunk: ${result.chunkIndex}

${result.content}
`;
      })
      .join("\n");

    // -----------------------------------------
    // Create prompt
    // -----------------------------------------

    const prompt = `
You are a GitHub repository code assistant.

Answer the user's question using ONLY
the repository context provided below.

If the answer cannot be found in the
provided context, say:

"I could not find the answer in the provided repository context."

Do not invent code or information.

When useful, mention the file name
where the information was found.

USER QUESTION:
${question}

REPOSITORY CONTEXT:
${context}

Answer clearly and concisely.
`;

    // -----------------------------------------
    // Send context to Ollama
    // -----------------------------------------

    console.log(
      "Sending context to Ollama..."
    );

    const ollamaResponse =
      await axios.post(
        "http://localhost:11434/api/generate",
        {
          model: "llama3.2:3b",

          prompt: prompt,

          stream: false,
        }
      );

    const answer =
      ollamaResponse.data.response;

    // -----------------------------------------
    // Return answer
    // -----------------------------------------

    res.json({
      answer: answer,

      sources: results.map(
        (result) => ({
          filePath:
            result.filePath,

          chunkIndex:
            result.chunkIndex,

          score:
            result.score,
        })
      ),
    });

  } catch (error) {
    console.error(
      "Question answering error:",
      error.response?.data ||
        error.message
    );

    res.status(500).json({
      message:
        "Failed to answer question",
    });
  }
};

module.exports = {
  ingestRepository,
  askQuestion,
};