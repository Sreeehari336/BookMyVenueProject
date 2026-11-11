import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { getCurrentUser } from "../services/authService";
import type { UserResponse, UserRole } from "../types/auth.types";
import { getToken, removeToken } from "../utils/token";

interface RequireRoleProps {
  roles: UserRole[];
}

function getRoleHome(role: UserRole): string {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "owner") {
    return "/owner/dashboard";
  }

  return "/home";
}

function RequireRole({ roles }: RequireRoleProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    const verifyUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
          setError("");
        }
      } catch (err: unknown) {
        const statusCode = (
          err as { response?: { status?: number } }
        )?.response?.status;

        if (active && statusCode === 401) {
          removeToken();
          setSessionExpired(true);
        } else if (active) {
          setError("Unable to verify your account. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifyUser();

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (!getToken() || sessionExpired) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main role="status" aria-live="polite">
        Verifying your account...
      </main>
    );
  }

  if (error) {
    return (
      <main role="alert">
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setRetryCount((count) => count + 1);
          }}
        >
          Try Again
        </button>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <Outlet />;
}

export default RequireRole;
