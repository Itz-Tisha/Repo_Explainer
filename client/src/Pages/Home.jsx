import { useEffect, useState } from "react";

function Home() {
  // -----------------------------------------
  // User
  // -----------------------------------------

  const [user, setUser] = useState(null);

  // -----------------------------------------
  // Repositories
  // -----------------------------------------

  const [repos, setRepos] = useState([]);

  const [selectedRepo, setSelectedRepo] =
    useState(null);

  // -----------------------------------------
  // Repository Files
  // -----------------------------------------

  const [files, setFiles] = useState([]);

  const [loadingRepos, setLoadingRepos] =
    useState(false);

  const [loadingFiles, setLoadingFiles] =
    useState(false);

  // -----------------------------------------
  // Repository Processing
  // -----------------------------------------

  const [processingRepo, setProcessingRepo] =
    useState(false);

  // -----------------------------------------
  // Question / Answer
  // -----------------------------------------

  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [sources, setSources] =
    useState([]);

  const [askingQuestion, setAskingQuestion] =
    useState(false);

  // -----------------------------------------
  // Get current user
  // -----------------------------------------

  useEffect(() => {
    fetch(
      "http://localhost:5000/api/auth/me",
      {
        credentials: "include",
      }
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error(
          "Failed to get user:",
          error
        );
      });
  }, []);

  // -----------------------------------------
  // Get repositories
  // -----------------------------------------

  const handleViewRepositories =
    async () => {
      try {
        setLoadingRepos(true);

        const response =
          await fetch(
            "http://localhost:5000/api/auth/repos",
            {
              credentials: "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(data.message);
          return;
        }

        setRepos(data);
      } catch (error) {
        console.error(error);

        alert(
          "Failed to fetch repositories"
        );
      } finally {
        setLoadingRepos(false);
      }
    };

  // -----------------------------------------
  // Select repository
  // -----------------------------------------

  const handleSelectRepository =
    async (repo) => {
      try {
        setSelectedRepo(repo);

        setLoadingFiles(true);

        setFiles([]);

        // Clear previous answer
        setQuestion("");
        setAnswer("");
        setSources([]);

        const response =
          await fetch(
            `http://localhost:5000/api/auth/repos/${repo.owner.login}/${repo.name}/files`,
            {
              credentials: "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(data.message);
          return;
        }

        console.log(
          "Repository data:",
          data
        );

        setFiles(data.files);
      } catch (error) {
        console.error(error);

        alert(
          "Failed to fetch repository files"
        );
      } finally {
        setLoadingFiles(false);
      }
    };

  // -----------------------------------------
  // Process Repository
  // -----------------------------------------
  //
  // Backend:
  //
  // 1. Gets repository files
  // 2. Splits files into chunks
  // 3. Creates local embeddings
  // 4. Stores chunks + embeddings in MongoDB
  //
  // -----------------------------------------

  const handleProcessRepository =
    async () => {
      if (!selectedRepo) {
        alert(
          "Please select a repository first."
        );

        return;
      }

      try {
        setProcessingRepo(true);

        const owner =
          selectedRepo.owner.login;

        const repoName =
          selectedRepo.name;

        const response =
          await fetch(
            `http://localhost:5000/api/rag/ingest/${owner}/${repoName}`,
            {
              method: "POST",

              credentials: "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Failed to process repository"
          );

          return;
        }

        console.log(
          "Repository processing result:",
          data
        );

        alert(
          `Repository processed successfully!\n\n` +
            `Repository: ${data.repository}\n` +
            `Files processed: ${data.filesProcessed}\n` +
            `Chunks stored: ${data.chunksStored}`
        );
      } catch (error) {
        console.error(
          "Processing error:",
          error
        );

        alert(
          "Failed to process repository. Check the backend console."
        );
      } finally {
        setProcessingRepo(false);
      }
    };

  // -----------------------------------------
  // Ask Question
  // -----------------------------------------
  //
  // Flow:
  //
  // User question
  //      ↓
  // Create question embedding
  //      ↓
  // MongoDB Vector Search
  //      ↓
  // Get relevant chunks
  //      ↓
  // Send chunks + question to Ollama
  //      ↓
  // Get final answer
  //
  // -----------------------------------------

  const handleAskQuestion =
    async () => {
      if (!selectedRepo) {
        alert(
          "Please select a repository first."
        );

        return;
      }

      if (!question.trim()) {
        alert(
          "Please enter a question."
        );

        return;
      }

      try {
        setAskingQuestion(true);

        setAnswer("");

        setSources([]);

        const owner =
          selectedRepo.owner.login;

        const repoName =
          selectedRepo.name;

        const response =
          await fetch(
            `http://localhost:5000/api/rag/ask/${owner}/${repoName}`,
            {
              method: "POST",

              credentials: "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                question:
                  question.trim(),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.message ||
              "Failed to answer question"
          );

          return;
        }

        console.log(
          "Question result:",
          data
        );

        setAnswer(data.answer);

        setSources(
          data.sources || []
        );
      } catch (error) {
        console.error(
          "Question error:",
          error
        );

        alert(
          "Failed to ask question. Check the backend console."
        );
      } finally {
        setAskingQuestion(false);
      }
    };

  // -----------------------------------------
  // Loading user
  // -----------------------------------------

  if (!user) {
    return <h2>Loading...</h2>;
  }

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* ================================= */}
      {/* USER INFORMATION */}
      {/* ================================= */}

      <h1>
        Welcome{" "}
        {user.displayName ||
          user.username}
      </h1>

      <img
        src={user.avatarUrl}
        alt="GitHub avatar"
        width="100"
      />

      <p>
        GitHub username:{" "}
        {user.username}
      </p>

      <hr />

      {/* ================================= */}
      {/* VIEW REPOSITORIES */}
      {/* ================================= */}

      <button
        onClick={
          handleViewRepositories
        }
        disabled={loadingRepos}
        style={{
          padding: "10px 15px",
          cursor: loadingRepos
            ? "not-allowed"
            : "pointer",
        }}
      >
        {loadingRepos
          ? "Loading repositories..."
          : "View My Repositories"}
      </button>

      <hr />

      {/* ================================= */}
      {/* REPOSITORY LIST */}
      {/* ================================= */}

      <h2>
        My Repositories
      </h2>

      {repos.length === 0 &&
        !loadingRepos && (
          <p>
            Click "View My
            Repositories" to load
            your repositories.
          </p>
        )}

      {repos.map((repo) => (
        <div
          key={repo.id}
          style={{
            border:
              "1px solid gray",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>
            {repo.name}
          </h3>

          <p>
            {repo.description ||
              "No description"}
          </p>

          <p>
            Language:{" "}
            {repo.language ||
              "Unknown"}
          </p>

          <button
            onClick={() =>
              handleSelectRepository(
                repo
              )
            }
            style={{
              padding:
                "8px 15px",
            }}
          >
            Select Repository
          </button>
        </div>
      ))}

      {/* ================================= */}
      {/* SELECTED REPOSITORY */}
      {/* ================================= */}

      {selectedRepo && (
        <>
          <hr />

          <h2>
            Selected Repository:{" "}
            {selectedRepo.name}
          </h2>

          {/* ================================= */}
          {/* PROCESS REPOSITORY */}
          {/* ================================= */}

          <button
            onClick={
              handleProcessRepository
            }
            disabled={
              processingRepo ||
              loadingFiles
            }
            style={{
              padding:
                "12px 20px",

              marginBottom:
                "10px",

              cursor:
                processingRepo ||
                loadingFiles
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {processingRepo
              ? "Processing Repository..."
              : "Process Repository"}
          </button>

          <p>
            This will chunk the
            repository files, create
            local embeddings, and
            store them in MongoDB
            Atlas Vector Search.
          </p>

          {/* ================================= */}
          {/* ASK QUESTION */}
          {/* ================================= */}

          <hr />

          <h2>
            Ask About This
            Repository
          </h2>

          <textarea
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            placeholder="Ask something about this repository..."
            rows="5"
            style={{
              width: "100%",
              maxWidth: "700px",
              padding: "10px",
              fontSize: "16px",
              borderRadius: "6px",
              border:
                "1px solid #ccc",
              boxSizing:
                "border-box",
            }}
          />

          <br />

          <button
            onClick={
              handleAskQuestion
            }
            disabled={
              askingQuestion
            }
            style={{
              marginTop:
                "10px",

              padding:
                "10px 20px",

              cursor:
                askingQuestion
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {askingQuestion
              ? "Finding answer..."
              : "Ask Question"}
          </button>

          {/* ================================= */}
          {/* ANSWER */}
          {/* ================================= */}

          {answer && (
            <div
              style={{
                marginTop:
                  "20px",

                padding:
                  "20px",

                border:
                  "1px solid #ccc",

                borderRadius:
                  "8px",

                maxWidth:
                  "900px",
              }}
            >
              <h3>
                Answer
              </h3>

              <p
                style={{
                  whiteSpace:
                    "pre-wrap",

                  lineHeight:
                    "1.6",
                }}
              >
                {answer}
              </p>

              {/* ============================= */}
              {/* SOURCES */}
              {/* ============================= */}

              {sources.length >
                0 && (
                <>
                  <hr />

                  <h3>
                    Sources
                  </h3>

                  {sources.map(
                    (
                      source,
                      index
                    ) => (
                      <div
                        key={
                          `${source.filePath}-${source.chunkIndex}-${index}`
                        }
                        style={{
                          padding:
                            "10px",

                          marginBottom:
                            "8px",

                          border:
                            "1px solid #ddd",

                          borderRadius:
                            "5px",
                        }}
                      >
                        <strong>
                          {source.filePath}
                        </strong>

                        <p>
                          Chunk:{" "}
                          {
                            source.chunkIndex
                          }
                        </p>

                        <p>
                          Similarity
                          score:{" "}
                          {typeof source.score ===
                          "number"
                            ? source.score.toFixed(
                                4
                              )
                            : "N/A"}
                        </p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}

          {/* ================================= */}
          {/* REPOSITORY FILES */}
          {/* ================================= */}

          <hr />

          {loadingFiles ? (
            <p>
              Loading repository
              files...
            </p>
          ) : (
            <>
              <p>
                Total files:{" "}
                {files.length}
              </p>

              <h3>
                Repository Files
              </h3>

              {files.map(
                (file) => (
                  <div
                    key={
                      file.path
                    }
                    style={{
                      border:
                        "1px solid #ddd",

                      padding:
                        "10px",

                      marginBottom:
                        "8px",

                      borderRadius:
                        "5px",
                    }}
                  >
                    <strong>
                      {file.path}
                    </strong>

                    <p>
                      Size:{" "}
                      {file.size}{" "}
                      bytes
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </>
      )}

      {/* ================================= */}
      {/* LOGOUT */}
      {/* ================================= */}

      <hr />

      <button
        onClick={() => {
          window.location.href =
            "http://localhost:5000/api/auth/logout";
        }}
        style={{
          padding:
            "10px 20px",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Home;