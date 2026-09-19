const mongoose = require("mongoose");

const embeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    repository: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Embedding",
  embeddingSchema
);