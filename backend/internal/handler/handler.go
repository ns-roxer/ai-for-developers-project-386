package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"

	"github.com/hexlet/call-booking/backend/internal/models"
	"github.com/hexlet/call-booking/backend/internal/service"
)

type Handler struct {
	svc    *service.Service
	logger *slog.Logger
}

func New(svc *service.Service, logger *slog.Logger) *Handler {
	return &Handler{svc: svc, logger: logger}
}

func (h *Handler) Router(allowedOrigins []string) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RealIP)
	r.Use(middleware.RequestID)
	r.Use(h.loggingMiddleware)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/event-types", h.listEventTypes)
	r.Get("/event-types/{eventTypeId}/available-slots", h.getAvailableSlots)
	r.Post("/bookings", h.createBooking)
	r.Post("/admin/event-types", h.createEventType)
	r.Get("/admin/upcoming-bookings", h.listUpcomingBookings)

	return r
}

func (h *Handler) listEventTypes(w http.ResponseWriter, r *http.Request) {
	types, err := h.svc.ListEventTypes(r.Context())
	if err != nil {
		h.internalError(w, r, err)
		return
	}
	h.writeJSON(w, http.StatusOK, types)
}

func (h *Handler) getAvailableSlots(w http.ResponseWriter, r *http.Request) {
	eventTypeID, err := uuid.Parse(chi.URLParam(r, "eventTypeId"))
	if err != nil {
		h.writeError(w, http.StatusUnprocessableEntity, "INVALID_ID", "eventTypeId must be a valid UUID")
		return
	}

	dateStr := r.URL.Query().Get("date")
	if dateStr == "" {
		h.writeError(w, http.StatusUnprocessableEntity, "MISSING_PARAM", "date query parameter is required")
		return
	}

	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		h.writeError(w, http.StatusUnprocessableEntity, "INVALID_DATE", "date must be in YYYY-MM-DD format")
		return
	}

	slots, err := h.svc.GetAvailableSlots(r.Context(), eventTypeID, date)
	if err != nil {
		h.mapServiceError(w, r, err)
		return
	}
	h.writeJSON(w, http.StatusOK, slots)
}

func (h *Handler) createBooking(w http.ResponseWriter, r *http.Request) {
	var req models.BookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusUnprocessableEntity, "INVALID_BODY", "invalid JSON request body")
		return
	}

	booking, err := h.svc.CreateBooking(r.Context(), req)
	if err != nil {
		h.mapServiceError(w, r, err)
		return
	}
	h.writeJSON(w, http.StatusCreated, booking)
}

func (h *Handler) createEventType(w http.ResponseWriter, r *http.Request) {
	var req models.CreateEventTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusUnprocessableEntity, "INVALID_BODY", "invalid JSON request body")
		return
	}

	et, err := h.svc.CreateEventType(r.Context(), req)
	if err != nil {
		h.mapServiceError(w, r, err)
		return
	}
	h.writeJSON(w, http.StatusCreated, et)
}

func (h *Handler) listUpcomingBookings(w http.ResponseWriter, r *http.Request) {
	bookings, err := h.svc.ListUpcomingBookings(r.Context())
	if err != nil {
		h.internalError(w, r, err)
		return
	}
	h.writeJSON(w, http.StatusOK, bookings)
}

func (h *Handler) mapServiceError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		h.writeError(w, http.StatusNotFound, "NOT_FOUND", err.Error())
	case errors.Is(err, service.ErrConflict):
		h.writeError(w, http.StatusConflict, "CONFLICT", err.Error())
	case errors.Is(err, service.ErrInvalidRequest):
		h.writeError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", err.Error())
	default:
		h.internalError(w, r, err)
	}
}

func (h *Handler) internalError(w http.ResponseWriter, r *http.Request, err error) {
	h.logger.ErrorContext(r.Context(), "internal server error",
		slog.String("error", err.Error()),
		slog.String("path", r.URL.Path),
	)
	h.writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
}

func (h *Handler) writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func (h *Handler) writeError(w http.ResponseWriter, status int, code, message string) {
	h.writeJSON(w, status, models.ErrorResponse{
		Code:    code,
		Message: message,
	})
}

func (h *Handler) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		next.ServeHTTP(ww, r)

		h.logger.InfoContext(r.Context(), "request",
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", ww.Status()),
			slog.Duration("duration", time.Since(start)),
			slog.String("remote", r.RemoteAddr),
			slog.String("request_id", middleware.GetReqID(r.Context())),
		)
	})
}

func ParseCORSOrigins(origins string) []string {
	parts := strings.Split(origins, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
