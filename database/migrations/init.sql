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



CREATE TABLE IF NOT EXISTS leads (

    id SERIAL PRIMARY KEY,

    session_id VARCHAR(255)
    UNIQUE NOT NULL,

    name TEXT,

    email TEXT,

    company TEXT,

    industry TEXT,

    budget TEXT,

    timeline TEXT,

    pain_points TEXT,

    score INTEGER DEFAULT 0,

    status VARCHAR(50)
    DEFAULT 'cold',
state VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);



CREATE TABLE IF NOT EXISTS bookings (

    id SERIAL PRIMARY KEY,

    session_id VARCHAR(255),

    lead_id INTEGER
    REFERENCES leads(id),

    name TEXT,

    email TEXT,

    service TEXT,

    slot TIMESTAMP,

    meet_link TEXT,

    event_id TEXT,

    status VARCHAR(50)
    DEFAULT 'confirmed',

    created_at TIMESTAMP DEFAULT NOW()

);