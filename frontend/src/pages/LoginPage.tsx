
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

// import { login } from "../services/authService";
import { setToken } from "../utils/token";

import "./LoginPage.css";
import { login, getCurrentUser } from "../services/authService";


function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();

  //   setError("");
  //   setIsLoading(true);

  //   try {
  //     const response = await login({
  //       email,
  //       password,
  //     });

  //     console.log("Login response:", response);

  //     setToken(response["access token"]);

  //     // Temporary redirect until we confirm how your API returns the role.
  //     navigate("/home");

  //     console.log("Login successful");
  //   } catch (error) {
  //     console.error("Login error:", error);
  //     setError("Invalid email or password.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  setError("");
  setIsLoading(true);

  try {
    // 1. Authenticate the user
    const response = await login({
      email,
      password,
    });

    // 2. Save the access token
    setToken(response["access token"]);

    // 3. Fetch authenticated user details
    const currentUser = await getCurrentUser();

    console.log("Logged-in user:", currentUser);

    // 4. Redirect according to the user's role
    if (currentUser.role === "owner") {
      navigate("/owner/dashboard");
    } else if (currentUser.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/home");
    }

  } catch (error) {
    console.error("Login error:", error);
    setError("Login failed. Please check your credentials and try again.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-visual-content">
          <h1>Find the perfect venue</h1>
          <p>
            Discover beautiful spaces for weddings, celebrations,
            corporate events and everything in between.
          </p>
        </div>
      </section>

      <section className="login-form-section">
        <button type="button" className="login-sign-in">
          Sign in
        </button>

        <div className="login-form-container">
          <h2>Welcome Back to BookMyVenue!</h2>

          <p className="login-subtitle">
            Sign in to continue to your account
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Your Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a
                href="#"
                className="forgot-password"
                onClick={(event) => event.preventDefault()}
              >
                Forgot Password?
              </a>
            </div>

            {error && (
              <p className="login-error">{error}</p>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <p className="login-register">
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
