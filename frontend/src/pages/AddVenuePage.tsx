
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { addVenue } from "../services/ownerService";
import type { VenueCreate } from "../services/ownerService";
import LogoutButton from "../components/LogoutButton";

import "./AddVenuePage.css";

function AddVenuePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [capacity, setCapacity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const price = Number(pricePerHour);
    const venueCapacity = capacity.trim() === "" ? null : Number(capacity);

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

    setLoading(true);

    try {
      await addVenue(venueData);
      setSuccess(true);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: unknown } } }
      )?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to add venue. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="add-venue-status">
        <div className="add-venue-success">
          <div className="add-venue-success-icon">✓</div>
          <h1>Venue added successfully!</h1>
          <p>Your new venue has been listed on BookMyVenue.</p>

          <button onClick={() => navigate("/owner/dashboard")}>
            Back to Owner Dashboard
          </button>

          <button
            className="add-another-button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setAddress("");
              setCity("");
              setPricePerHour("");
              setCapacity("");
              setSuccess(false);
            }}
          >
            Add Another Venue
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="add-venue-page">
      <header className="add-venue-navbar">
        <button
          className="add-venue-brand"
          onClick={() => navigate("/owner/dashboard")}
        >
          BookMyVenue
        </button>

        <button
          className="add-venue-back"
          onClick={() => navigate("/owner/dashboard")}
        >
          ← Back to Dashboard
        </button>
        <LogoutButton />
      </header>

      <section className="add-venue-container">
        <div className="add-venue-heading">
          <p className="add-venue-eyebrow">OWNER PORTAL</p>
          <h1>Add a New Venue</h1>
          <p>Enter your venue details to list it on BookMyVenue.</p>
        </div>

        <form className="add-venue-form" onSubmit={handleSubmit}>
          {error && <div className="add-venue-error">{error}</div>}

          <div className="add-venue-field">
            <label htmlFor="title">Venue Name</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Grand Celebration Hall"
              maxLength={100}
              required
            />
          </div>

          <div className="add-venue-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your venue and its facilities..."
              maxLength={100}
              rows={4}
              required
            />
            <small>{description.length}/100 characters</small>
          </div>

          <div className="add-venue-field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Enter venue address"
              maxLength={100}
              required
            />
          </div>

          <div className="add-venue-field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="e.g. Kochi"
              maxLength={100}
              required
            />
          </div>

          <div className="add-venue-two-columns">
            <div className="add-venue-field">
              <label htmlFor="pricePerHour">Price per Hour (₹)</label>
              <input
                id="pricePerHour"
                type="number"
                min="1"
                step="1"
                value={pricePerHour}
                onChange={(event) => setPricePerHour(event.target.value)}
                placeholder="e.g. 900"
                required
              />
            </div>

            <div className="add-venue-field">
              <label htmlFor="capacity">Capacity (people)</label>
              <input
                id="capacity"
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="e.g. 200"
              />
              <small>Optional</small>
            </div>
          </div>

          <button
            className="add-venue-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Adding Venue..." : "Add Venue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AddVenuePage;
