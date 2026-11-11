import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUserRole,
} from "../services/adminService";
import type { UserResponse, UserRole } from "../types/auth.types";
import LogoutButton from "../components/LogoutButton";

import "./AdminUsersPage.css";

type UserFilter = "all" | UserRole;

function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (
    error as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;

  return typeof detail === "string" ? detail : fallback;
}

function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, UserRole>>(
    {}
  );
  const [filter, setFilter] = useState<UserFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers(filter === "all" ? undefined : filter);
        if (active) {
          setUsers(data);
          setSelectedRoles(
            Object.fromEntries(data.map((user) => [user.user_id, user.role]))
          );
          setError("");
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load users. Please try again.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      active = false;
    };
  }, [filter, reloadCount]);

  const handleFilterChange = (nextFilter: UserFilter) => {
    setLoading(true);
    setError("");
    setFilter(nextFilter);
  };

  const retryLoadingUsers = () => {
    setLoading(true);
    setError("");
    setReloadCount((count) => count + 1);
  };

  const handleRoleChange = async (user: UserResponse) => {
    const role = selectedRoles[user.user_id];
    if (!role || role === user.role) {
      return;
    }

    setBusyUserId(user.user_id);
    setActionError("");

    try {
      const updatedUser = await updateAdminUserRole(user.user_id, role);
      setUsers((currentUsers) =>
        currentUsers
          .map((currentUser) =>
            currentUser.user_id === updatedUser.user_id
              ? updatedUser
              : currentUser
          )
          .filter(
            (currentUser) =>
              filter === "all" || currentUser.role === filter
          )
      );
      setSelectedRoles((currentRoles) => ({
        ...currentRoles,
        [updatedUser.user_id]: updatedUser.role,
      }));
    } catch (err: unknown) {
      setActionError(
        getErrorMessage(err, "Unable to update the user's role.")
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (user: UserResponse) => {
    const confirmed = window.confirm(
      `Delete user "${user.username}" (${user.email})? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setBusyUserId(user.user_id);
    setActionError("");

    try {
      await deleteAdminUser(user.user_id);
      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => currentUser.user_id !== user.user_id
        )
      );
    } catch (err: unknown) {
      setActionError(
        getErrorMessage(err, "Unable to delete this user.")
      );
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <main className="admin-users-page">
      <header className="admin-users-navbar">
        <strong>BookMyVenue Admin</strong>
        <nav>
          <button onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => navigate("/admin/bookings")}>
            Manage Bookings
          </button>
          <button onClick={() => navigate("/admin/venues")}>
            Manage Venues
          </button>
          <button onClick={() => navigate("/home")}>Customer Home</button>
          <LogoutButton />
        </nav>
      </header>

      <section className="admin-users-content">
        <div className="admin-users-heading">
          <div>
            <p>ADMIN PORTAL</p>
            <h1>Users</h1>
            <span>View users and manage their account roles.</span>
          </div>

          <label>
            Filter by role
            <select
              value={filter}
              onChange={(event) =>
                handleFilterChange(event.target.value as UserFilter)
              }
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {actionError && (
          <div className="admin-users-error" role="alert">
            {actionError}
          </div>
        )}

        {loading && (
          <p className="admin-users-message">Loading users...</p>
        )}

        {!loading && error && (
          <div className="admin-users-error" role="alert">
            <p>{error}</p>
            <button onClick={retryLoadingUsers}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="admin-users-message">No users found.</div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>#{user.user_id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        aria-label={`Role for ${user.username}`}
                        value={selectedRoles[user.user_id] ?? user.role}
                        onChange={(event) =>
                          setSelectedRoles((currentRoles) => ({
                            ...currentRoles,
                            [user.user_id]: event.target.value as UserRole,
                          }))
                        }
                        disabled={busyUserId === user.user_id}
                      >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <div className="admin-users-actions">
                        <button
                          onClick={() => handleRoleChange(user)}
                          disabled={
                            busyUserId === user.user_id ||
                            selectedRoles[user.user_id] === user.role
                          }
                        >
                          Save Role
                        </button>
                        <button
                          className="admin-users-delete"
                          onClick={() => handleDeleteUser(user)}
                          disabled={busyUserId === user.user_id}
                        >
                          {busyUserId === user.user_id
                            ? "Working..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminUsersPage;
