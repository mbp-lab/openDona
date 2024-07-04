CREATE TABLE donations (
    donor_id     VARCHAR(250) PRIMARY KEY NOT NULL,
    ingestion_id BIGINT                 NULL,
    status       donation_status        NOT NULL,
    created_at   TIMESTAMP              NOT NULL,
    updated_at   TIMESTAMP              NOT NULL
)