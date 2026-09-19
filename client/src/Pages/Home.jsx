import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);

  const [repos, setRepos] = useState([]);

  const [selectedRepo, setSelectedRepo] = useState(null);

  const [files, setFiles] = useState([]);

  const [loadingRepos, setLoadingRepos] = useState(false);

  const [loadingFiles, setLoadingFiles] = useState(false);

  const [processingRepo, setProcessingRepo] = useState(false);

  // -----------------------------------------
  // Get current user
  // -----------------------------------------

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setUser(data);
      })
      .catch((error) => {
        console.error("Failed to get user:", error);
      });
  }, []);

  // -----------------------------------------
  // Get repositories
  // -----------------------------------------

  const handleViewRepositories = async () => {
    try {
      setLoadingRepos(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/repos",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setRepos(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  // -----------------------------------------
  // Select repository
  // -----------------------------------------

  const handleSelectRepository = async (repo) => {
    try {
      setSelectedRepo(repo);

      setLoadingFiles(true);

      setFiles([]);

      const response = await fetch(
        `http://localhost:5000/api/auth/repos/${repo.owner.login}/${repo.name}/files`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      console.log("Repository data:", data);

      setFiles(data.files);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch repository files");
    } finally {
      setLoadingFiles(false);
    }
  };

  // -----------------------------------------
  // Process Repository
  // -----------------------------------------
  // This sends the selected repository to the backend.
  //
  // Backend will:
  // 1. Get repository files
  // 2. Split files into chunks
  // 3. Create embeddings
  // 4. Store chunks + embeddings in MongoDB
  // -----------------------------------------

  const handleProcessRepository = async () => {
    if (!selectedRepo) {
      alert("Please select a repository first.");
      return;
    }

    try {
      setProcessingRepo(true);

      const owner = selectedRepo.owner.login;
      const repoName = selectedRepo.name;

      const response = await fetch(
        `http://localhost:5000/api/rag/ingest/${owner}/${repoName}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to process repository");
        return;
      }

      console.log("Repository processing result:", data);

      alert(
        `Repository processed successfully!\n\n` +
          `Repository: ${data.repository}\n` +
          `Files processed: ${data.filesProcessed}\n` +
          `Chunks stored: ${data.chunksStored}`
      );
    } catch (error) {
      console.error("Processing error:", error);

      alert(
        "Failed to process repository. Check the backend console."
      );
    } finally {
      setProcessingRepo(false);
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
    <div style={{ padding: "30px" }}>
      {/* -------------------------------- */}
      {/* User Information */}
      {/* -------------------------------- */}

      <h1>
        Welcome {user.displayName || user.username}
      </h1>

      <img
        src={user.avatarUrl}
        alt="GitHub avatar"
        width="100"
      />

      <p>
        GitHub username: {user.username}
      </p>

      <hr />

      {/* -------------------------------- */}
      {/* Repository Button */}
      {/* -------------------------------- */}

      <button
        onClick={handleViewRepositories}
        disabled={loadingRepos}
      >
        {loadingRepos
          ? "Loading repositories..."
          : "View My Repositories"}
      </button>

      <hr />

      {/* -------------------------------- */}
      {/* Repository List */}
      {/* -------------------------------- */}

      <h2>My Repositories</h2>

      {repos.length === 0 && !loadingRepos && (
        <p>
          Click "View My Repositories" to load your repositories.
        </p>
      )}

      {repos.map((repo) => (
        <div
          key={repo.id}
          style={{
            border: "1px solid gray",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <h3>{repo.name}</h3>

          <p>
            {repo.description || "No description"}
          </p>

          <p>
            Language:{" "}
            {repo.language || "Unknown"}
          </p>

          <button
            onClick={() =>
              handleSelectRepository(repo)
            }
          >
            Select Repository
          </button>
        </div>
      ))}

      {/* -------------------------------- */}
      {/* Selected Repository */}
      {/* -------------------------------- */}

      {selectedRepo && (
        <>
          <hr />

          <h2>
            Selected Repository:{" "}
            {selectedRepo.name}
          </h2>

          {/* -------------------------------- */}
          {/* Process Repository Button */}
          {/* -------------------------------- */}

          <button
            onClick={handleProcessRepository}
            disabled={
              processingRepo || loadingFiles
            }
            style={{
              padding: "12px 20px",
              marginBottom: "20px",
              cursor:
                processingRepo || loadingFiles
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {processingRepo
              ? "Processing Repository..."
              : "Process Repository"}
          </button>

          <p>
            This will chunk the repository files,
            create embeddings, and store them in
            MongoDB Atlas Vector Search.
          </p>

          {/* -------------------------------- */}
          {/* Repository Files */}
          {/* -------------------------------- */}

          {loadingFiles ? (
            <p>
              Loading repository files...
            </p>
          ) : (
            <>
              <p>
                Total files: {files.length}
              </p>

              <h3>Repository Files</h3>

              {files.map((file) => (
                <div
                  key={file.path}
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    marginBottom: "8px",
                    borderRadius: "5px",
                  }}
                >
                  <strong>
                    {file.path}
                  </strong>

                  <p>
                    Size: {file.size} bytes
                  </p>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <hr />

      {/* -------------------------------- */}
      {/* Logout */}
      {/* -------------------------------- */}

      <button
        onClick={() => {
          window.location.href =
            "http://localhost:5000/api/auth/logout";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Home;