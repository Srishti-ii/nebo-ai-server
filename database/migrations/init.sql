-- USERS
CREATE TABLE IF NOT EXISTS users (

    id SERIAL PRIMARY KEY,

    name TEXT,

    email TEXT UNIQUE,

    phone TEXT,

    created_at TIMESTAMP DEFAULT NOW()

);



-- CONVERSATIONS

CREATE TABLE IF NOT EXISTS conversations (

    id SERIAL PRIMARY KEY,

    session_id TEXT UNIQUE,

    user_id INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user
    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE SET NULL

);



-- CHAT MESSAGES

CREATE TABLE IF NOT EXISTS messages (

    id SERIAL PRIMARY KEY,

    conversation_id INTEGER,

    role TEXT NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),


    CONSTRAINT fk_conversation
    FOREIGN KEY(conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE

);



-- LEADS

CREATE TABLE IF NOT EXISTS leads (

    id SERIAL PRIMARY KEY,

    conversation_id INTEGER,

    name TEXT,

    email TEXT,

    company TEXT,

    service TEXT,

    requirements TEXT,

    lead_score INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),


    CONSTRAINT fk_lead_conversation
    FOREIGN KEY(conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE

);



-- BOOKINGS

CREATE TABLE IF NOT EXISTS bookings (

    id SERIAL PRIMARY KEY,

    conversation_id INTEGER,

    event_id TEXT,

    meet_link TEXT,

    slot TIMESTAMP,

    status TEXT DEFAULT 'confirmed',

    created_at TIMESTAMP DEFAULT NOW(),


    CONSTRAINT fk_booking_conversation
    FOREIGN KEY(conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE

);