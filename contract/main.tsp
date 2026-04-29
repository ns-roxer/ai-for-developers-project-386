import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{
  title: "Call Booking API",
})
@server("http://localhost:8080", "Local development server")
namespace CallBooking;

// ─── Models ────────────────────────────────────────────────────

model EventType {
  id: string;
  name: string;
  description: string;

  @doc("Duration in minutes")
  duration: int32;
}

model CreateEventTypeRequest {
  name: string;
  description: string;

  @doc("Duration in minutes")
  duration: int32;
}

model TimeSlot {
  startTime: utcDateTime;
  endTime: utcDateTime;
}

model BookingRequest {
  eventTypeId: string;
  startTime: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model Booking {
  id: string;
  eventTypeId: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  guestName: string;
  guestEmail: string;
}

model UpcomingBooking {
  ...Booking;
  eventTypeName: string;
}

model ErrorResponse {
  code: string;
  message: string;
}

// ─── Guest Routes ──────────────────────────────────────────────

@route("/event-types")
namespace EventTypes {
  @doc("List all available event types")
  @get
  op list(): {
    @statusCode statusCode: 200;
    @body body: EventType[];
  };

  @route("{eventTypeId}/available-slots")
  @doc("Get available time slots for a specific event type on a given date (within 14-day window)")
  @get
  op getAvailableSlots(
    @path eventTypeId: string,
    @query date: plainDate,
  ): {
    @statusCode statusCode: 200;
    @body body: TimeSlot[];
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 422;
    @body body: ErrorResponse;
  };
}

@route("/bookings")
namespace Bookings {
  @doc("Create a new booking")
  @post
  op create(@body body: BookingRequest): {
    @statusCode statusCode: 201;
    @body body: Booking;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 422;
    @body body: ErrorResponse;
  };
}

// ─── Admin Routes ──────────────────────────────────────────────

@route("/admin")
namespace Admin {
  @route("event-types")
  @doc("Create a new event type")
  @post
  op createEventType(@body body: CreateEventTypeRequest): {
    @statusCode statusCode: 201;
    @body body: EventType;
  } | {
    @statusCode statusCode: 422;
    @body body: ErrorResponse;
  };

  @route("upcoming-bookings")
  @doc("List all upcoming bookings across all event types, sorted by start time")
  @get
  op listUpcomingBookings(): {
    @statusCode statusCode: 200;
    @body body: UpcomingBooking[];
  };
}

