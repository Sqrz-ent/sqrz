"use client";

import { useState } from "react";

export default function BookingForm({
  profileSlug,
}: {
  profileSlug: string;
}) {
  const [form, setForm] = useState({
    projectName: "",
    description: "",

    dateStart: "",
    timeStart: "",
    dateEnd: "",
    timeEnd: "",

    locationType: "onsite",
    address: "",

    budgetType: "range",
    budgetMin: "",
    budgetMax: "",
    currency: "EUR",

    includeTravel: false,
    includeFood: false,
    includeHotel: false,

    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });

  function update(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : undefined;

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      profile_slug: profileSlug,
      ...form,
    };

    console.log("BOOKING PAYLOAD:", payload);

    // TODO: POST to Xano endpoint
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 48,
        padding: 24,
        borderRadius: 16,
        background: "#0b0b0b",
        border: "1px solid rgba(255,255,255,0.06)",
        textAlign: "left",
      }}
    >
      <h2 style={{ color: "#fff", marginBottom: 16 }}>
        Booking request
      </h2>

      {/* PROJECT */}
      <label>Project name *</label>
      <input
        name="projectName"
        value={form.projectName}
        onChange={update}
        required
      />

      <label>Description</label>
      <textarea
        name="description"
        rows={4}
        value={form.description}
        onChange={update}
      />

      {/* DATE & TIME */}
      <label>Start</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          name="dateStart"
          value={form.dateStart}
          onChange={update}
          required
        />
        <input
          type="time"
          name="timeStart"
          value={form.timeStart}
          onChange={update}
        />
      </div>

      <label>End (optional)</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="date"
          name="dateEnd"
          value={form.dateEnd}
          onChange={update}
        />
        <input
          type="time"
          name="timeEnd"
          value={form.timeEnd}
          onChange={update}
        />
      </div>

      {/* LOCATION */}
      <label>Location</label>
      <select
        name="locationType"
        value={form.locationType}
        onChange={update}
      >
        <option value="onsite">On-site</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
      </select>

      {form.locationType !== "remote" && (
        <>
          <label>Address</label>
          <input
            name="address"
            value={form.address}
            onChange={update}
          />
        </>
      )}

      {/* BUDGET */}
      <label>Budget</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          placeholder="From"
          name="budgetMin"
          value={form.budgetMin}
          onChange={update}
        />
        <input
          type="number"
          placeholder="To"
          name="budgetMax"
          value={form.budgetMax}
          onChange={update}
        />
        <select
          name="currency"
          value={form.currency}
          onChange={update}
        >
          <option>EUR</option>
          <option>USD</option>
          <option>GBP</option>
        </select>
      </div>

      {/* EXPENSES */}
      <label>Expenses covered</label>
      <div style={{ display: "flex", gap: 12 }}>
        <label>
          <input
            type="checkbox"
            name="includeTravel"
            checked={form.includeTravel}
            onChange={update}
          />
          Travel
        </label>

        <label>
          <input
            type="checkbox"
            name="includeFood"
            checked={form.includeFood}
            onChange={update}
          />
          Food
        </label>

        <label>
          <input
            type="checkbox"
            name="includeHotel"
            checked={form.includeHotel}
            onChange={update}
          />
          Hotel
        </label>
      </div>

      {/* BUYER */}
      <hr style={{ margin: "24px 0", opacity: 0.1 }} />

      <label>Your name *</label>
      <input
        name="buyerName"
        value={form.buyerName}
        onChange={update}
        required
      />

      <label>Email *</label>
      <input
        type="email"
        name="buyerEmail"
        value={form.buyerEmail}
        onChange={update}
        required
      />

      <label>Phone (optional)</label>
      <input
        name="buyerPhone"
        value={form.buyerPhone}
        onChange={update}
      />

      <button
        type="submit"
        style={{
          marginTop: 24,
          width: "100%",
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: "#f3b130",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Send booking request
      </button>

      <p
        style={{
          marginTop: 8,
          fontSize: 12,
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        No payment required at this stage
      </p>
    </form>
  );
}
