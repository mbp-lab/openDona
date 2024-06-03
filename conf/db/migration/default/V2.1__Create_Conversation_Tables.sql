-- edit donation table to be in line with new spec

ALTER TABLE donations
ADD COLUMN id uuid NULL;

-- UUID v4 hack stolen from https://stackoverflow.com/questions/12505158/generating-a-uuid-in-postgres-for-insert-statement
UPDATE donations
SET id = uuid_in(overlay(overlay(md5(random()::text || ':' || clock_timestamp()::text) placing '4' from 13) placing to_hex(floor(random()*(11-8+1) + 8)::int)::text from 17)::cstring);

ALTER TABLE donations
ALTER COLUMN id SET NOT NULL;

ALTER TABLE donations
DROP CONSTRAINT donations_pkey;

ALTER TABLE donations
ADD PRIMARY KEY (id);

ALTER TABLE donations
RENAME COLUMN donor_id TO external_donor_id;

ALTER TABLE donations
ALTER COLUMN external_donor_id SET NOT NULL;

ALTER TABLE donations
ADD CONSTRAINT donations_external_donor_id_unique UNIQUE (external_donor_id);

ALTER TABLE donations
ADD COLUMN donor_id uuid;

-- add new tables

CREATE TABLE data_sources (
    id                      INTEGER         PRIMARY KEY,
    name                    VARCHAR(1024)   NOT NULL
);

INSERT INTO data_sources (id, name) VALUES
(1, 'Facebook'),
(2, 'WhatsApp'),
(3, 'Instagram');

CREATE TABLE conversations (
    id                      uuid            PRIMARY KEY,
    is_group_conversation   BOOLEAN         NOT NULL,
    data_source_id          INTEGER         NOT NULL REFERENCES data_sources(id),
    donation_id             uuid            NOT NULL REFERENCES donations(id)
);

CREATE TABLE conversation_participants (
    id                      uuid            PRIMARY KEY,
    conversation_id         uuid            NOT NULL REFERENCES conversations(id),
    participant_id          uuid            NOT NULL
);

CREATE TABLE messages(
    id                      uuid            PRIMARY KEY,
    conversation_id         uuid            NOT NULL REFERENCES conversations(id),
    sender_id               uuid            NOT NULL,
    datetime                TIMESTAMP       NOT NULL,
    word_count              INTEGER         NOT NULL
);

CREATE TABLE messages_audio(
                         id                      uuid            PRIMARY KEY,
                         conversation_id         uuid            NOT NULL REFERENCES conversations(id),
                         sender_id               uuid            NOT NULL,
                         datetime                TIMESTAMP       NOT NULL,
                         length_seconds          INTEGER
);