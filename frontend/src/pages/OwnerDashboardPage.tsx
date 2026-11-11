import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyVenues,
  deleteVenue,
} from "../services/ownerService";
import { getOwnerBookings } from "../services/ownerBookingService";

import type { Venue } from "../types/venue.types";
import type { OwnerBooking } from "../types/ownerBooking.types";

import { getVenueImage } from "../utils/venueImages";
import LogoutButton from "../components/LogoutButton";

import "./OwnerDashboardPage.css";

function OwnerDashboardPage() {
  const navigate = useNavigate();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingVenueId, setDeletingVenueId] = useState<number | null>(null);
  const [bookingStatsLoading, setBookingStatsLoading] = useState(true);
  const [bookingStatsError, setBookingStatsError] = useState("");
  const [bookingStatsRetry, setBookingStatsRetry] = useState(0);

  const loadVenues = async () => {
    try {
      setError("");
      const data = await getMyVenues();
      setVenues(data);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load your venues. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    const loadOwnerBookings = async () => {
      try {
        setBookingStatsError("");
        setBookingStatsLoading(true);

        const data = await getOwnerBookings();
        setOwnerBookings(data);
      } catch (err: unknown) {
        const detail = (
          err as { response?: { data?: { detail?: unknown } } }
        )?.response?.data?.detail;

        setBookingStatsError(
          typeof detail === "string"
            ? detail
            : "Unable to load booking statistics. Please try again."
        );
      } finally {
        setBookingStatsLoading(false);
      }
    };

    loadOwnerBookings();
  }, [bookingStatsRetry]);

  const confirmedBookings = ownerBookings.filter(
    (booking) => booking.status.toLowerCase() === "confirmed"
  );

  const cancelledBookings = ownerBookings.filter(
    (booking) => booking.status.toLowerCase() === "cancelled"
  );

  const confirmedRevenue = confirmedBookings.reduce(
    (total, booking) => total + booking.total_price,
    0
  );

  const handleDeleteVenue = async (
    venueId: number,
    venueTitle: string
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${venueTitle}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeletingVenueId(venueId);

    try {
      await deleteVenue(venueId);

      setVenues((currentVenues) =>
        currentVenues.filter((venue) => venue.venue_id !== venueId)
      );
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setDeleteError(
        typeof detail === "string"
          ? detail
          : "Unable to delete venue. Please try again."
      );
    } finally {
      setDeletingVenueId(null);
    }
  };

  return (
    <main className="owner-dashboard">
      <header className="owner-navbar">
        <button
          className="owner-brand"
          onClick={() => navigate("/home")}
        >
          BookMyVenue
        </button>

        <div className="owner-navbar-actions">
          <button
            className="owner-home-button"
            onClick={() => navigate("/home")}
          >
            Customer Home
          </button>
          <LogoutButton />
        </div>
      </header>

      <section className="owner-dashboard-content">
        <div className="owner-dashboard-heading">
          <div>
            <p className="owner-eyebrow">OWNER PORTAL</p>
            <h1>Owner Dashboard</h1>
            <p>Manage your venues and monitor your business.</p>
          </div>

          <button
            className="owner-add-button"
            onClick={() => navigate("/owner/venues/add")}
          >
            + Add New Venue
          </button>

          <button
            className="owner-bookings-link"
            onClick={() => navigate("/owner/bookings")}
          >
            View Bookings
          </button>
        </div>

        <section className="owner-stats">
          <article className="owner-stat-card">
            <span>Total Venues</span>
            <strong>{venues.length}</strong>
          </article>

          <article className="owner-stat-card">
            <span>Total Bookings</span>
            <strong>
              {bookingStatsLoading
                ? "..."
                : bookingStatsError
                  ? "—"
                  : ownerBookings.length}
            </strong>
          </article>

          <article className="owner-stat-card">
            <span>Confirmed Bookings</span>
            <strong>
              {bookingStatsLoading
                ? "..."
                : bookingStatsError
                  ? "—"
                  : confirmedBookings.length}
            </strong>
          </article>

          <article className="owner-stat-card">
            <span>Cancelled Bookings</span>
            <strong>
              {bookingStatsLoading
                ? "..."
                : bookingStatsError
                  ? "—"
                  : cancelledBookings.length}
            </strong>
          </article>

          <article className="owner-stat-card">
            <span>Confirmed Revenue</span>
            <strong>
              {bookingStatsLoading || bookingStatsError
                ? "—"
                : `₹${confirmedRevenue.toLocaleString("en-IN")}`}
            </strong>
          </article>
        </section>

        {bookingStatsError && (
          <div className="owner-error" role="alert">
            <p>{bookingStatsError}</p>
            <button
              onClick={() =>
                setBookingStatsRetry((current) => current + 1)
              }
            >
              Try Again
            </button>
          </div>
        )}

        <section className="owner-venues-section">
          <div className="owner-section-heading">
            <div>
              <h2>My Venues</h2>
              <p>View and manage the venues you have listed.</p>
            </div>
          </div>

          {loading && (
            <div className="owner-message">
              Loading your venues...
            </div>
          )}

          {!loading && error && (
            <div className="owner-error">
              <p>{error}</p>
              <button onClick={loadVenues}>Try Again</button>
            </div>
          )}

          {!loading && !error && deleteError && (
            <div className="owner-error">
              {deleteError}
            </div>
          )}

          {!loading && !error && venues.length === 0 && (
            <div className="owner-empty-state">
              <h3>No venues listed yet</h3>
              <p>
                You haven't added any venues. Start by listing
                your first venue.
              </p>
              <button
                className="owner-add-button"
                onClick={() => navigate("/owner/venues/add")}
              >
                + Add Your First Venue
              </button>
            </div>
          )}

          {!loading && !error && venues.length > 0 && (
            <div className="owner-venue-grid">
              {venues.map((venue) => (
                <article
                  className="owner-venue-card"
                  key={venue.venue_id}
                >
                  <img
                    src={getVenueImage(venue.venue_id)}
                    alt={venue.title}
                  />

                  <div className="owner-venue-info">
                    <h3>{venue.title}</h3>
                    <p>{venue.city}</p>

                    <div className="owner-venue-details">
                      <span>
                        ₹
                        {venue.price_per_hour.toLocaleString("en-IN")}
                        {" / hour"}
                      </span>

                      {venue.capacity != null && (
                        <span>
                          Capacity: {venue.capacity} people
                        </span>
                      )}
                    </div>

                    <div className="owner-venue-actions">
                      <button
                        className="owner-bookings-button"
                        onClick={() =>
                          navigate(
                            `/owner/venues/${venue.venue_id}/bookings`
                          )
                        }
                      >
                        View Bookings
                      </button>

                      <button
                        className="owner-view-button"
                        onClick={() =>
                          navigate(`/venues/${venue.venue_id}`)
                        }
                      >
                        View Venue
                      </button>

                      <button
                        className="owner-edit-button"
                        onClick={() =>
                          navigate(
                            `/owner/venues/edit/${venue.venue_id}`
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="owner-delete-button"
                        disabled={deletingVenueId === venue.venue_id}
                        onClick={() =>
                          handleDeleteVenue(
                            venue.venue_id,
                            venue.title
                          )
                        }
                      >
                        {deletingVenueId === venue.venue_id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default OwnerDashboardPage;