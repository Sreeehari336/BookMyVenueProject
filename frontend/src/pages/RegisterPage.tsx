import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

import "./LoginPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"user" | "owner">("user");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await register({
        username,
        email,
        password,
        role,
      });

      console.log("Registration successful:", response);

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const axiosError = error as {
          response?: {
            data?: {
              detail?: string;
            };
          };
        };

        setError(
          axiosError.response?.data?.detail ??
            "Registration failed. Please try again."
        );
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <section className="login-visual">
        <div className="login-visual-content">
          <h1>Find the perfect venue</h1>

          <p>
            Discover beautiful spaces for weddings, celebrations,
            corporate events and everything in between.
          </p>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="login-form-section">
        <div className="login-form-container">
          <h2>Create your account</h2>

          <p className="login-subtitle">
            Join BookMyVenue and discover amazing venues
          </p>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* USERNAME */}
            <div className="login-field">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter your username"
                minLength={1}
                maxLength={100}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="login-field">
              <label htmlFor="email">
                Your Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter your email"
                maxLength={50}
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a password"
                  minLength={1}
                  maxLength={100}
                  required
                />
                <button
                  type="button"
                  className="password-visibility-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* ROLE */}
            <div className="login-field">
              <label htmlFor="role">
                Account Type
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target.value as "user" | "owner"
                  )
                }
              >
                <option value="user">
                  User
                </option>

                <option value="owner">
                  Venue Owner
                </option>
              </select>
            </div>

            {/* ERROR */}
            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            {/* SUCCESS */}
            {success && (
              <p className="login-success">
                {success}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading
                ? "Creating account..."
                : "Create Account"}
            </button>
          </form>

          {/* LOGIN LINK */}
          <p className="login-register">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default RegisterPage;