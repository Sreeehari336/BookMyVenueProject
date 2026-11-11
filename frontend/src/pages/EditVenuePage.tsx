
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMyVenues,
  updateVenue,
} from "../services/ownerService";

import type { VenueCreate } from "../services/ownerService";
import type { Venue } from "../types/venue.types";
import LogoutButton from "../components/LogoutButton";

import "./EditVenuePage.css";

function EditVenuePage() {
  const navigate = useNavigate();
  const { venueId } = useParams();

  const id = Number(venueId);

  const [venue, setVenue] = useState<Venue | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [capacity, setCapacity] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadVenue = async () => {
      if (!Number.isInteger(id) || id <= 0) {
        setError("Invalid venue ID.");
        setLoading(false);
        return;
      }

      try {
        const venues = await getMyVenues();

        const selectedVenue = venues.find(
          (item) => item.venue_id === id
        );

        if (!selectedVenue) {
          setError("Venue not found or you do not own this venue.");
          return;
        }

        setVenue(selectedVenue);
        setTitle(selectedVenue.title);
        setDescription(selectedVenue.description);
        setAddress(selectedVenue.address);
        setCity(selectedVenue.city);
        setPricePerHour(String(selectedVenue.price_per_hour));
        setCapacity(
          selectedVenue.capacity != null
            ? String(selectedVenue.capacity)
            : ""
        );
      } catch (err: unknown) {
        const detail = (
          err as { response?: { data?: { detail?: unknown } } }
        )?.response?.data?.detail;

        setError(
          typeof detail === "string"
            ? detail
            : "Unable to load venue details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [id]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");

    if (!venue) {
      setError("Venue details are unavailable.");
      return;
    }

    const price = Number(pricePerHour);
    const venueCapacity =
      capacity.trim() === "" ? null : Number(capacity);

    if (!Number.isFinite(price) || price < 1) {
      setError("Hourly price must be at least 1.");
      return;
    }

    if (
      venueCapacity !== null &&
      (!Number.isInteger(venueCapacity) || venueCapacity < 1)
    ) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    const venueData: VenueCreate = {
      title: title.trim(),
      description: description.trim(),
      address: address.trim(),
      city: city.trim(),
      price_per_hour: price,
      capacity: venueCapacity,
    };

    setSubmitting(true);

    try {
      await updateVenue(id, venueData);
      setSuccess(true);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to update venue. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-venue-status">
        Loading venue details...
      </div>
    );
  }

  if (success) {
    return (
      <main className="edit-venue-status">
        <div className="edit-venue-success">
          <h1>Venue updated successfully!</h1>
          <p>Your venue information has been updated.</p>
          <button onClick={() => navigate("/owner/dashboard")}>
            Back to Owner Dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className="edit-venue-status">
        <div>
          <p>{error || "Venue not found."}</p>
          <button onClick={() => navigate("/owner/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="edit-venue-page">
      <header className="edit-venue-navbar">
        <button
          className="edit-venue-brand"
          onClick={() => navigate("/owner/dashboard")}
        >
          BookMyVenue
        </button>

        <button
          className="edit-venue-back"
          onClick={() => navigate("/owner/dashboard")}
        >
          ← Back to Dashboard
        </button>
        <LogoutButton />
      </header>

      <section className="edit-venue-container">
        <div className="edit-venue-heading">
          <p className="edit-venue-eyebrow">OWNER PORTAL</p>
          <h1>Edit Venue</h1>
          <p>Update the information for {venue.title}.</p>
        </div>

        <form className="edit-venue-form" onSubmit={handleSubmit}>
          {error && (
            <div className="edit-venue-error">{error}</div>
          )}

          <div className="edit-venue-field">
            <label htmlFor="title">Venue Name</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="edit-venue-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={100}
              rows={4}
              required
            />
            <small>{description.length}/100 characters</small>
          </div>

          <div className="edit-venue-field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="edit-venue-field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="edit-venue-two-columns">
            <div className="edit-venue-field">
              <label htmlFor="pricePerHour">
                Price per Hour (₹)
              </label>
              <input
                id="pricePerHour"
                type="number"
                min="1"
                step="1"
                value={pricePerHour}
                onChange={(event) =>
                  setPricePerHour(event.target.value)
                }
                required
              />
            </div>

            <div className="edit-venue-field">
              <label htmlFor="capacity">Capacity (people)</label>
              <input
                id="capacity"
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(event) =>
                  setCapacity(event.target.value)
                }
              />
              <small>Optional</small>
            </div>
          </div>

          <button
            className="edit-venue-submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default EditVenuePage;
