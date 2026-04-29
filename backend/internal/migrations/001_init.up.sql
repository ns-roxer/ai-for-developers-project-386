CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE event_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    duration    INT          NOT NULL CHECK (duration > 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type_id UUID         NOT NULL REFERENCES event_types(id),
    start_time    TIMESTAMPTZ  NOT NULL,
    end_time      TIMESTAMPTZ  NOT NULL,
    guest_name    VARCHAR(255) NOT NULL,
    guest_email   VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT bookings_time_order CHECK (end_time > start_time),
    CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
        event_type_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    )
);

CREATE INDEX idx_bookings_event_type ON bookings (event_type_id);
CREATE INDEX idx_bookings_start_time ON bookings (start_time);
