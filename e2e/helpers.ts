import { test as base, expect, type Page } from "@playwright/test";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
export const API_BASE = "http://localhost:8080";

export const SEED_EVENT_TYPES = [
  "15 Minute Meeting",
  "30 Minute Meeting",
  "60 Minute Meeting",
] as const;

export const TEST_GUEST = {
  name: "E2E Test User",
  email: "e2e@test.example",
};

// ──────────────────────────────────────────────
// API helpers (talk directly to backend on :8080)
// ──────────────────────────────────────────────
export interface EventType {
  id: string;
  name: string;
  description: string;
  duration: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

/** Fetch all event types from the backend */
export async function getEventTypes(): Promise<EventType[]> {
  const res = await fetch(`${API_BASE}/event-types`);
  if (!res.ok) throw new Error(`GET /event-types failed: ${res.status}`);
  return res.json();
}

/** Create an event type via the admin API */
export async function createEventType(body: {
  name: string;
  description: string;
  duration: number;
}): Promise<EventType> {
  const res = await fetch(`${API_BASE}/admin/event-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(`POST /admin/event-types failed: ${res.status}`);
  return res.json();
}

/** Get available slots for a given event type and date (YYYY-MM-DD) */
export async function getAvailableSlots(
  eventTypeId: string,
  date: string
): Promise<TimeSlot[]> {
  const res = await fetch(
    `${API_BASE}/event-types/${eventTypeId}/available-slots?date=${date}`
  );
  if (!res.ok) throw new Error(`GET available-slots failed: ${res.status}`);
  return res.json();
}

/** Create a booking via the API */
export async function createBookingAPI(body: {
  eventTypeId: string;
  startTime: string;
  guestName: string;
  guestEmail: string;
}) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /bookings failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────
// Date helpers
// ──────────────────────────────────────────────

/** Returns tomorrow's date as YYYY-MM-DD (always a valid bookable date) */
export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Returns a date N days from today as YYYY-MM-DD */
export function getDatePlusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────
// Re-exports for convenience
// ──────────────────────────────────────────────
export { base as test, expect, type Page };

