function Login() {
  const handleGithubLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/github";
  };

  return (
    <div>
      <h1>GitHub Repository Explainer</h1>

      <button onClick={handleGithubLogin}>
        Login with GitHub
      </button>
    </div>
  );
}

export default Login;