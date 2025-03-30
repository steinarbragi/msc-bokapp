-- Table to store anonymous survey sessions
CREATE TABLE survey_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);
-- Table to store pre-generation survey responses
CREATE TABLE question_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    question TEXT NOT NULL,
    question_key TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, question_key)
);

-- Table to store generated questions
CREATE TABLE generated_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Table to store post-generation survey responses 
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    question_key TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store generated book cover descriptions
CREATE TABLE generated_descriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    description_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store book metadata
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store search results
CREATE TABLE search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    description_id UUID REFERENCES generated_descriptions(id),
    book_id TEXT REFERENCES books(id),
    similarity_score FLOAT NOT NULL,
    rank_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store book recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    book_id TEXT REFERENCES books(id),
    reasoning TEXT NOT NULL,
    rank_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store user feedback on recommendations
CREATE TABLE recommendation_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    recommendation_id UUID REFERENCES recommendations(id),
    is_relevant BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store read books for each session
CREATE TABLE read_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    book_id TEXT REFERENCES books(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_survey_responses_session ON survey_responses(session_id);
CREATE INDEX idx_generated_descriptions_session ON generated_descriptions(session_id);
CREATE INDEX idx_search_results_description ON search_results(description_id);
CREATE INDEX idx_search_results_session ON search_results(session_id);
CREATE INDEX idx_search_results_book ON search_results(book_id);
CREATE INDEX idx_recommendations_session ON recommendations(session_id);
CREATE INDEX idx_recommendations_book ON recommendations(book_id);
CREATE INDEX idx_recommendation_feedback_recommendation ON recommendation_feedback(recommendation_id);
CREATE INDEX idx_read_books_session ON read_books(session_id);
CREATE INDEX idx_read_books_book ON read_books(book_id); 