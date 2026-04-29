export interface EventType {
  id: string;
  name: string;
  description: string;
  /** Duration in minutes */
  duration: number;
}

export interface CreateEventTypeRequest {
  name: string;
  description: string;
  /** Duration in minutes */
  duration: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface BookingRequest {
  eventTypeId: string;
  startTime: string;
  guestName: string;
  guestEmail: string;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
}

export interface UpcomingBooking extends Booking {
  eventTypeName: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}

