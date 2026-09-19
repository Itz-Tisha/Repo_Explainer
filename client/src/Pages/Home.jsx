import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);

  const [repos, setRepos] = useState([]);

  const [selectedRepo, setSelectedRepo] = useState(null);

  const [files, setFiles] = useState([]);

  const [loadingRepos, setLoadingRepos] = useState(false);

  const [loadingFiles, setLoadingFiles] = useState(false);

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
      <h1>
        Welcome {user.displayName || user.username}
      </h1>

      <img
        src={user.avatarUrl}
        alt="GitHub avatar"
        width="100"
      />

      <p>GitHub username: {user.username}</p>

      <hr />

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

      {repos.map((repo) => (
        <div
          key={repo.id}
          style={{
            border: "1px solid gray",
            padding: "15px",
            marginBottom: "10px",
          }}
        >
          <h3>{repo.name}</h3>

          <p>
            {repo.description ||
              "No description"}
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