package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/hexlet/call-booking/backend/internal/models"
	"github.com/hexlet/call-booking/backend/internal/repository"
)

const (
	workDayStart = 9  // 09:00
	workDayEnd   = 17 // 17:00
	slotMinutes  = 30
	bookingWindow = 14 // days
)

var (
	ErrNotFound       = errors.New("not found")
	ErrConflict       = errors.New("time slot already booked")
	ErrInvalidRequest = errors.New("invalid request")
)

type Service struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListEventTypes(ctx context.Context) ([]models.EventType, error) {
	return s.repo.ListEventTypes(ctx)
}

func (s *Service) CreateEventType(ctx context.Context, req models.CreateEventTypeRequest) (models.EventType, error) {
	if strings.TrimSpace(req.Name) == "" {
		return models.EventType{}, fmt.Errorf("%w: name is required", ErrInvalidRequest)
	}
	if req.Duration <= 0 {
		return models.EventType{}, fmt.Errorf("%w: duration must be positive", ErrInvalidRequest)
	}
	return s.repo.CreateEventType(ctx, req)
}

func (s *Service) GetAvailableSlots(ctx context.Context, eventTypeID uuid.UUID, date time.Time) ([]models.TimeSlot, error) {
	today := truncateToDate(time.Now().UTC())
	requestedDate := truncateToDate(date.UTC())

	if requestedDate.Before(today) {
		return nil, fmt.Errorf("%w: date cannot be in the past", ErrInvalidRequest)
	}

	maxDate := today.AddDate(0, 0, bookingWindow)
	if requestedDate.After(maxDate) || requestedDate.Equal(maxDate) {
		return nil, fmt.Errorf("%w: date must be within %d days from today", ErrInvalidRequest, bookingWindow)
	}

	et, err := s.repo.GetEventTypeByID(ctx, eventTypeID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, fmt.Errorf("%w: event type not found", ErrNotFound)
		}
		return nil, err
	}

	dayStart := requestedDate.Add(time.Duration(workDayStart) * time.Hour)
	dayEnd := requestedDate.Add(time.Duration(workDayEnd) * time.Hour)

	bookings, err := s.repo.GetBookingsForDateRange(ctx, eventTypeID, dayStart, dayEnd)
	if err != nil {
		return nil, err
	}

	bookedSet := make(map[time.Time]bool, len(bookings))
	for _, b := range bookings {
		bookedSet[b.StartTime.UTC()] = true
	}

	slotDuration := time.Duration(et.Duration) * time.Minute
	var slots []models.TimeSlot
	for t := dayStart; t.Add(slotDuration).Before(dayEnd) || t.Add(slotDuration).Equal(dayEnd); t = t.Add(slotDuration) {
		if !bookedSet[t] {
			slots = append(slots, models.TimeSlot{
				StartTime: t,
				EndTime:   t.Add(slotDuration),
			})
		}
	}

	if slots == nil {
		slots = []models.TimeSlot{}
	}
	return slots, nil
}

func (s *Service) CreateBooking(ctx context.Context, req models.BookingRequest) (models.Booking, error) {
	if err := validateBookingRequest(req); err != nil {
		return models.Booking{}, err
	}

	startUTC := req.StartTime.UTC()
	today := truncateToDate(time.Now().UTC())
	reqDate := truncateToDate(startUTC)

	if reqDate.Before(today) {
		return models.Booking{}, fmt.Errorf("%w: start time cannot be in the past", ErrInvalidRequest)
	}
	maxDate := today.AddDate(0, 0, bookingWindow)
	if reqDate.After(maxDate) || reqDate.Equal(maxDate) {
		return models.Booking{}, fmt.Errorf("%w: booking must be within %d days from today", ErrInvalidRequest, bookingWindow)
	}

	hour := startUTC.Hour()
	minute := startUTC.Minute()
	if hour < workDayStart || hour >= workDayEnd {
		return models.Booking{}, fmt.Errorf("%w: start time must be within working hours (%d:00-%d:00 UTC)", ErrInvalidRequest, workDayStart, workDayEnd)
	}
	if minute%slotMinutes != 0 {
		return models.Booking{}, fmt.Errorf("%w: start time must align to %d-minute boundaries", ErrInvalidRequest, slotMinutes)
	}

	et, err := s.repo.GetEventTypeByID(ctx, req.EventTypeID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return models.Booking{}, fmt.Errorf("%w: event type not found", ErrNotFound)
		}
		return models.Booking{}, err
	}

	endTime := startUTC.Add(time.Duration(et.Duration) * time.Minute)

	booking, err := s.repo.CreateBooking(ctx, req, endTime)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23P01" {
			return models.Booking{}, fmt.Errorf("%w: this time slot is already booked", ErrConflict)
		}
		return models.Booking{}, err
	}

	return booking, nil
}

func (s *Service) ListUpcomingBookings(ctx context.Context) ([]models.UpcomingBooking, error) {
	bookings, err := s.repo.ListUpcomingBookings(ctx)
	if err != nil {
		return nil, err
	}
	if bookings == nil {
		bookings = []models.UpcomingBooking{}
	}
	return bookings, nil
}

func validateBookingRequest(req models.BookingRequest) error {
	if req.EventTypeID == uuid.Nil {
		return fmt.Errorf("%w: eventTypeId is required", ErrInvalidRequest)
	}
	if strings.TrimSpace(req.GuestName) == "" {
		return fmt.Errorf("%w: guestName is required", ErrInvalidRequest)
	}
	if strings.TrimSpace(req.GuestEmail) == "" {
		return fmt.Errorf("%w: guestEmail is required", ErrInvalidRequest)
	}
	if req.StartTime.IsZero() {
		return fmt.Errorf("%w: startTime is required", ErrInvalidRequest)
	}
	return nil
}

func truncateToDate(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}
