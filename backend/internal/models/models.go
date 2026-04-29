package models

import (
	"time"

	"github.com/google/uuid"
)

type EventType struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Duration    int32     `json:"duration"`
	CreatedAt   time.Time `json:"-"`
}

type CreateEventTypeRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Duration    int32  `json:"duration"`
}

type Booking struct {
	ID          uuid.UUID `json:"id"`
	EventTypeID uuid.UUID `json:"eventTypeId"`
	StartTime   time.Time `json:"startTime"`
	EndTime     time.Time `json:"endTime"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
	CreatedAt   time.Time `json:"-"`
}

type BookingRequest struct {
	EventTypeID uuid.UUID `json:"eventTypeId"`
	StartTime   time.Time `json:"startTime"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
}

type UpcomingBooking struct {
	ID            uuid.UUID `json:"id"`
	EventTypeID   uuid.UUID `json:"eventTypeId"`
	StartTime     time.Time `json:"startTime"`
	EndTime       time.Time `json:"endTime"`
	GuestName     string    `json:"guestName"`
	GuestEmail    string    `json:"guestEmail"`
	EventTypeName string    `json:"eventTypeName"`
}

type TimeSlot struct {
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
}

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
