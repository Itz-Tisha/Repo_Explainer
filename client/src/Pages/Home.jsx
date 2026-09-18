import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get logged-in user
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setUser(data);
      });
  }, []);

  // Get repositories
  const handleViewRepositories = async () => {
    try {
      setLoading(true);

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
      console.error("Error fetching repositories:", error);
      alert("Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>Welcome {user.displayName || user.username}</h1>

      <img
        src={user.avatarUrl}
        alt="GitHub avatar"
        width="100"
      />

      <p>GitHub username: {user.username}</p>

      <button onClick={handleViewRepositories}>
        {loading ? "Loading..." : "View My Repositories"}
      </button>

      <hr />

      <h2>My Repositories</h2>

      {repos.length === 0 ? (
        <p>No repositories loaded.</p>
      ) : (
        <div>
          {repos.map((repo) => (
            <div key={repo.id}>
              <h3>{repo.name}</h3>

              <p>
                {repo.description || "No description"}
              </p>

              <p>
                ⭐ {repo.stargazers_count}
              </p>

              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
              >
                Open on GitHub
              </a>

              <hr />
            </div>
          ))}
        </div>
      )}

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