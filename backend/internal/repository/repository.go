package repository

import (
	"context"
	"errors"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hexlet/call-booking/backend/internal/models"
)

var psql = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

var (
	ErrNotFound       = errors.New("not found")
	ErrConflict       = errors.New("time slot already booked")
	ErrInvalidRequest = errors.New("invalid request")
)

type Repository struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ListEventTypes(ctx context.Context) ([]models.EventType, error) {
	query, args, err := psql.
		Select("id", "name", "description", "duration").
		From("event_types").
		OrderBy("name").
		ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.EventType
	for rows.Next() {
		var et models.EventType
		if err := rows.Scan(&et.ID, &et.Name, &et.Description, &et.Duration); err != nil {
			return nil, err
		}
		result = append(result, et)
	}
	return result, rows.Err()
}

func (r *Repository) GetEventTypeByID(ctx context.Context, id uuid.UUID) (models.EventType, error) {
	query, args, err := psql.
		Select("id", "name", "description", "duration").
		From("event_types").
		Where(sq.Eq{"id": id}).
		ToSql()
	if err != nil {
		return models.EventType{}, err
	}

	var et models.EventType
	err = r.pool.QueryRow(ctx, query, args...).Scan(&et.ID, &et.Name, &et.Description, &et.Duration)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.EventType{}, ErrNotFound
	}
	return et, err
}

func (r *Repository) CreateEventType(ctx context.Context, req models.CreateEventTypeRequest) (models.EventType, error) {
	query, args, err := psql.
		Insert("event_types").
		Columns("name", "description", "duration").
		Values(req.Name, req.Description, req.Duration).
		Suffix("RETURNING id, name, description, duration").
		ToSql()
	if err != nil {
		return models.EventType{}, err
	}

	var et models.EventType
	err = r.pool.QueryRow(ctx, query, args...).Scan(&et.ID, &et.Name, &et.Description, &et.Duration)
	return et, err
}

func (r *Repository) CreateBooking(ctx context.Context, req models.BookingRequest, endTime time.Time) (models.Booking, error) {
	query, args, err := psql.
		Insert("bookings").
		Columns("event_type_id", "start_time", "end_time", "guest_name", "guest_email").
		Values(req.EventTypeID, req.StartTime, endTime, req.GuestName, req.GuestEmail).
		Suffix("RETURNING id, event_type_id, start_time, end_time, guest_name, guest_email").
		ToSql()
	if err != nil {
		return models.Booking{}, err
	}

	var b models.Booking
	err = r.pool.QueryRow(ctx, query, args...).Scan(
		&b.ID, &b.EventTypeID, &b.StartTime, &b.EndTime, &b.GuestName, &b.GuestEmail,
	)
	return b, err
}

func (r *Repository) ListUpcomingBookings(ctx context.Context) ([]models.UpcomingBooking, error) {
	query, args, err := psql.
		Select(
			"b.id", "b.event_type_id", "b.start_time", "b.end_time",
			"b.guest_name", "b.guest_email", "et.name AS event_type_name",
		).
		From("bookings b").
		Join("event_types et ON et.id = b.event_type_id").
		Where(sq.Gt{"b.start_time": time.Now()}).
		OrderBy("b.start_time").
		ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.UpcomingBooking
	for rows.Next() {
		var ub models.UpcomingBooking
		if err := rows.Scan(
			&ub.ID, &ub.EventTypeID, &ub.StartTime, &ub.EndTime,
			&ub.GuestName, &ub.GuestEmail, &ub.EventTypeName,
		); err != nil {
			return nil, err
		}
		result = append(result, ub)
	}
	return result, rows.Err()
}

// GetBookingsForDateRange returns existing bookings for a given event type
// within a time range. Used by the slots service to compute availability.
func (r *Repository) GetBookingsForDateRange(ctx context.Context, eventTypeID uuid.UUID, from, to time.Time) ([]models.Booking, error) {
	query, args, err := psql.
		Select("id", "event_type_id", "start_time", "end_time", "guest_name", "guest_email").
		From("bookings").
		Where(sq.Eq{"event_type_id": eventTypeID}).
		Where(sq.GtOrEq{"start_time": from}).
		Where(sq.Lt{"start_time": to}).
		OrderBy("start_time").
		ToSql()
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.Booking
	for rows.Next() {
		var b models.Booking
		if err := rows.Scan(&b.ID, &b.EventTypeID, &b.StartTime, &b.EndTime, &b.GuestName, &b.GuestEmail); err != nil {
			return nil, err
		}
		result = append(result, b)
	}
	return result, rows.Err()
}
