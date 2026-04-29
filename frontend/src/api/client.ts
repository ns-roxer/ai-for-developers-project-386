import axios from "axios";
import type {
  EventType,
  CreateEventTypeRequest,
  TimeSlot,
  BookingRequest,
  Booking,
  UpcomingBooking,
} from "./types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Guest endpoints
export async function getEventTypes(): Promise<EventType[]> {
  const { data } = await api.get<EventType[]>("/event-types");
  return data;
}

export async function getAvailableSlots(
  eventTypeId: string,
  date: string
): Promise<TimeSlot[]> {
  const { data } = await api.get<TimeSlot[]>(
    `/event-types/${eventTypeId}/available-slots`,
    { params: { date } }
  );
  return data;
}

export async function createBooking(body: BookingRequest): Promise<Booking> {
  const { data } = await api.post<Booking>("/bookings", body);
  return data;
}

// Admin endpoints
export async function createEventType(
  body: CreateEventTypeRequest
): Promise<EventType> {
  const { data } = await api.post<EventType>("/admin/event-types", body);
  return data;
}

export async function getUpcomingBookings(): Promise<UpcomingBooking[]> {
  const { data } = await api.get<UpcomingBooking[]>(
    "/admin/upcoming-bookings"
  );
  return data;
}

