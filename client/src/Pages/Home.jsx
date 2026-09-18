import { useEffect, useState } from "react";

function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setUser(data);
      });
  }, []);

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