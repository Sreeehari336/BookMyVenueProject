import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createAdminVenue,
  deleteAdminVenue,
  getAdminUsers,
  getAdminVenues,
  updateAdminVenue,
  updateAdminVenueOwner,
} from "../services/adminService";
import type {
  AdminVenue,
  AdminVenueCreate,
  AdminVenueUpdate,
} from "../services/adminService";
import type { UserResponse } from "../types/auth.types";
import LogoutButton from "../components/LogoutButton";

import "./AdminVenuesPage.css";

function getErrorMessage(error: unknown, fallback: string): string {
  const detail = (
    error as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;

  return typeof detail === "string" ? detail : fallback;
}

const emptyVenueForm: AdminVenueCreate = {
  title: "",
  description: "",
  address: "",
  city: "",
  price_per_hour: 1,
  capacity: null,
  owner_id: 0,
};

function AdminVenuesPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [owners, setOwners] = useState<UserResponse[]>([]);
  const [form, setForm] = useState<AdminVenueCreate>(emptyVenueForm);
  const [editingVenue, setEditingVenue] = useState<AdminVenue | null>(null);
  const [editForm, setEditForm] = useState<AdminVenueUpdate | null>(null);
  const [ownerSelections, setOwnerSelections] = useState<Record<number, number>>(
    {}
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyVenueId, setBusyVenueId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchAdminVenues = async () => {
      try {
        const [venueData, ownerData] = await Promise.all([
          getAdminVenues(),
          getAdminUsers("owner"),
        ]);

        if (active) {
          setVenues(venueData);
          setOwners(ownerData);
          setOwnerSelections(
            Object.fromEntries(
              venueData.map((venue) => [venue.venue_id, venue.owner_id])
            )
          );
          setError("");
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load venue management data.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAdminVenues();
    return () => {
      active = false;
    };
  }, [reloadCount]);

  const ownerById = useMemo(
    () => new Map(owners.map((owner) => [owner.user_id, owner])),
    [owners]
  );

  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return venues;
    }

    return venues.filter((venue) => {
      const owner = ownerById.get(venue.owner_id);
      return (
        venue.title.toLowerCase().includes(query) ||
        venue.city.toLowerCase().includes(query) ||
        owner?.username.toLowerCase().includes(query) === true ||
        owner?.email.toLowerCase().includes(query) === true
      );
    });
  }, [ownerById, search, venues]);

  const retryLoading = () => {
    setLoading(true);
    setError("");
    setReloadCount((count) => count + 1);
  };

  const handleCreateVenue = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setActionError("");
    setActionMessage("");

    try {
      const createdVenue = await createAdminVenue(form);
      setVenues((currentVenues) => [...currentVenues, createdVenue]);
      setOwnerSelections((currentSelections) => ({
        ...currentSelections,
        [createdVenue.venue_id]: createdVenue.owner_id,
      }));
      setForm(emptyVenueForm);
      setActionMessage("Venue created successfully.");
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Unable to create this venue."));
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (venue: AdminVenue) => {
    setActionError("");
    setActionMessage("");
    setEditingVenue(venue);
    setEditForm({
      title: venue.title,
      city: venue.city,
      price_per_hour: venue.price_per_hour,
      capacity: venue.capacity,
    });
  };

  const handleSaveVenue = async () => {
    if (!editingVenue || !editForm) {
      return;
    }

    setBusyVenueId(editingVenue.venue_id);
    setActionError("");
    setActionMessage("");

    try {
      const updatedVenue = await updateAdminVenue(
        editingVenue.venue_id,
        editForm
      );
      setVenues((currentVenues) =>
        currentVenues.map((venue) =>
          venue.venue_id === updatedVenue.venue_id ? updatedVenue : venue
        )
      );
      setEditingVenue(null);
      setEditForm(null);
      setActionMessage("Venue details updated.");
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Unable to update this venue."));
    } finally {
      setBusyVenueId(null);
    }
  };

  const handleOwnerChange = async (venue: AdminVenue, ownerId: number) => {
    if (!ownerId || ownerId === venue.owner_id) {
      return;
    }

    setBusyVenueId(venue.venue_id);
    setActionError("");
    setActionMessage("");

    try {
      const updatedVenue = await updateAdminVenueOwner(venue.venue_id, ownerId);
      setVenues((currentVenues) =>
        currentVenues.map((currentVenue) =>
          currentVenue.venue_id === updatedVenue.venue_id
            ? updatedVenue
            : currentVenue
        )
      );
      setActionMessage("Venue owner updated.");
    } catch (err: unknown) {
      setOwnerSelections((currentSelections) => ({
        ...currentSelections,
        [venue.venue_id]: venue.owner_id,
      }));
      setActionError(getErrorMessage(err, "Unable to change this venue owner."));
    } finally {
      setBusyVenueId(null);
    }
  };

  const handleDeleteVenue = async (venue: AdminVenue) => {
    const confirmed = window.confirm(
      `Delete "${venue.title}"? Venues with active bookings cannot be deleted.`
    );

    if (!confirmed) {
      return;
    }

    setBusyVenueId(venue.venue_id);
    setActionError("");
    setActionMessage("");

    try {
      await deleteAdminVenue(venue.venue_id);
      setVenues((currentVenues) =>
        currentVenues.filter(
          (currentVenue) => currentVenue.venue_id !== venue.venue_id
        )
      );
      setActionMessage("Venue deleted.");
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Unable to delete this venue."));
    } finally {
      setBusyVenueId(null);
    }
  };

  return (
    <main className="admin-venues-page">
      <header className="admin-venues-navbar">
        <strong>BookMyVenue Admin</strong>
        <nav>
          <button onClick={() => navigate("/admin/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => navigate("/admin/users")}>Manage Users</button>
          <button onClick={() => navigate("/admin/bookings")}>
            Manage Bookings
          </button>
          <button onClick={() => navigate("/home")}>Customer Home</button>
          <LogoutButton />
        </nav>
      </header>

      <section className="admin-venues-content">
        <div className="admin-venues-heading">
          <div>
            <p>ADMIN PORTAL</p>
            <h1>Venues</h1>
            <span>Create, update, reassign, and remove listed venues.</span>
          </div>
        </div>

        {!loading && !error && (
          <form className="admin-venue-create" onSubmit={handleCreateVenue}>
            <h2>Add Venue</h2>
            <div className="admin-venue-form-grid">
              <label>
                Title
                <input
                  required
                  maxLength={100}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>
              <label>
                City
                <input
                  required
                  maxLength={100}
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                />
              </label>
              <label>
                Address
                <input
                  required
                  maxLength={100}
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                />
              </label>
              <label>
                Description
                <input
                  required
                  maxLength={100}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label>
                Price per hour (₹)
                <input
                  required
                  type="number"
                  min="1"
                  value={form.price_per_hour}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price_per_hour: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Capacity
                <input
                  type="number"
                  min="1"
                  value={form.capacity ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      capacity: event.target.value
                        ? Number(event.target.value)
                        : null,
                    })
                  }
                />
              </label>
              <label>
                Owner
                <select
                  required
                  value={form.owner_id || ""}
                  onChange={(event) =>
                    setForm({ ...form, owner_id: Number(event.target.value) })
                  }
                >
                  <option value="" disabled>
                    Select an owner
                  </option>
                  {owners.map((owner) => (
                    <option key={owner.user_id} value={owner.user_id}>
                      {owner.username} ({owner.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" disabled={creating || owners.length === 0}>
              {creating ? "Creating..." : "Create Venue"}
            </button>
            {owners.length === 0 && (
              <p className="admin-venues-note">
                Create or assign an owner account before adding a venue.
              </p>
            )}
          </form>
        )}

        {actionError && (
          <div className="admin-venues-error" role="alert">
            {actionError}
          </div>
        )}
        {actionMessage && (
          <p className="admin-venues-success" role="status">
            {actionMessage}
          </p>
        )}

        {loading && (
          <p className="admin-venues-message">Loading venues...</p>
        )}
        {!loading && error && (
          <div className="admin-venues-error" role="alert">
            <p>{error}</p>
            <button onClick={retryLoading}>Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <section className="admin-venues-list">
            <div className="admin-venues-list-heading">
              <h2>All Venues ({venues.length})</h2>
              <input
                aria-label="Search venues"
                placeholder="Search title, city, or owner"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {filteredVenues.length === 0 ? (
              <div className="admin-venues-message">No venues found.</div>
            ) : (
              <div className="admin-venues-table-wrapper">
                <table className="admin-venues-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Venue</th>
                      <th>City</th>
                      <th>Price / hour</th>
                      <th>Capacity</th>
                      <th>Owner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVenues.map((venue) => {
                      const owner = ownerById.get(venue.owner_id);
                      const isEditing = editingVenue?.venue_id === venue.venue_id;

                      return (
                        <tr key={venue.venue_id}>
                          <td>#{venue.venue_id}</td>
                          <td>
                            {isEditing && editForm ? (
                              <input
                                aria-label="Venue title"
                                required
                                value={editForm.title}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    title: event.target.value,
                                  })
                                }
                              />
                            ) : (
                              venue.title
                            )}
                          </td>
                          <td>
                            {isEditing && editForm ? (
                              <input
                                aria-label="Venue city"
                                required
                                value={editForm.city}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    city: event.target.value,
                                  })
                                }
                              />
                            ) : (
                              venue.city
                            )}
                          </td>
                          <td>
                            {isEditing && editForm ? (
                              <input
                                aria-label="Price per hour"
                                required
                                type="number"
                                min="1"
                                value={editForm.price_per_hour}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    price_per_hour: Number(event.target.value),
                                  })
                                }
                              />
                            ) : (
                              `₹${venue.price_per_hour.toLocaleString("en-IN")}`
                            )}
                          </td>
                          <td>
                            {isEditing && editForm ? (
                              <input
                                aria-label="Venue capacity"
                                type="number"
                                min="1"
                                value={editForm.capacity ?? ""}
                                onChange={(event) =>
                                  setEditForm({
                                    ...editForm,
                                    capacity: event.target.value
                                      ? Number(event.target.value)
                                      : null,
                                  })
                                }
                              />
                            ) : (
                              venue.capacity ?? "Not specified"
                            )}
                          </td>
                          <td>
                            <div className="admin-venue-owner">
                              <span>
                                {owner?.username ?? `Owner #${venue.owner_id}`}
                              </span>
                              {owner && <small>{owner.email}</small>}
                              <select
                                aria-label={`Assign owner for ${venue.title}`}
                                value={
                                  ownerSelections[venue.venue_id] ??
                                  venue.owner_id
                                }
                                disabled={busyVenueId === venue.venue_id}
                                onChange={(event) => {
                                  const ownerId = Number(event.target.value);
                                  setOwnerSelections((current) => ({
                                    ...current,
                                    [venue.venue_id]: ownerId,
                                  }));
                                  void handleOwnerChange(venue, ownerId);
                                }}
                              >
                                {owners.map((venueOwner) => (
                                  <option
                                    key={venueOwner.user_id}
                                    value={venueOwner.user_id}
                                  >
                                    {venueOwner.username}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td>
                            <div className="admin-venue-actions">
                              {isEditing ? (
                                <>
                                  <button
                                    disabled={busyVenueId === venue.venue_id}
                                    onClick={() => void handleSaveVenue()}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingVenue(null);
                                      setEditForm(null);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => startEditing(venue)}>
                                  Edit
                                </button>
                              )}
                              <button
                                className="admin-venue-delete"
                                disabled={busyVenueId === venue.venue_id}
                                onClick={() => void handleDeleteVenue(venue)}
                              >
                                {busyVenueId === venue.venue_id
                                  ? "Working..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default AdminVenuesPage;
