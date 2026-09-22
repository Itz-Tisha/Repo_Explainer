# GitHub Repository Explainer 🤖

An AI-powered GitHub repository analysis platform that uses **Retrieval-Augmented Generation (RAG)** to understand codebases and answer questions about their source code.

The application allows users to authenticate with GitHub, select a repository, process its source files, generate local embeddings, store them in MongoDB, and ask natural-language questions about the repository.

---

## 🚀 Features

- 🔐 **GitHub OAuth Authentication**
  - Login securely using your GitHub account.
  - Access repositories available to the authenticated user.

- 📂 **Repository Explorer**
  - Fetch and display GitHub repositories.
  - Browse files inside a selected repository.

- 🧩 **Code Chunking**
  - Large source files are divided into smaller chunks.
  - Chunk overlap is used to preserve context between sections.

- 🧠 **Local Embeddings**
  - Repository chunks are converted into vector embeddings using:
    `Xenova/all-MiniLM-L6-v2`
  - No external embedding API is required.

- 🔎 **MongoDB Vector Search**
  - Embeddings are stored in MongoDB Atlas.
  - MongoDB Vector Search retrieves the most relevant code chunks for a user's question.

- 💬 **AI-Powered Q&A**
  - Ask questions about the selected repository using natural language.
  - Relevant code context is retrieved before generating the answer.

- 📚 **Source References**
  - Answers include the relevant repository files and chunks used for retrieval.

- 🔄 **RAG Pipeline**
  - Combines semantic search with an LLM to generate context-aware answers.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      React UI       │
                    │      (Vite)         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │       (Node.js)     │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
        ┌─────────────────┐        ┌─────────────────┐
        │    GitHub API   │        │   RAG Pipeline  │
        └────────┬────────┘        └────────┬────────┘
                 │                          │
                 ▼                          ▼
        Repository / Files          Chunk Repository
                                           │
                                           ▼
                                  Local Embedding Model
                                           │
                                           ▼
                                  MongoDB Atlas
                                  Vector Search
                                           │
                                           ▼
                                  Relevant Code Chunks
                                           │
                                           ▼
                                         Ollama
                                           │
                                           ▼
                                   Generated Answer
