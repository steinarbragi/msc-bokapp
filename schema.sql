-- Table to store anonymous survey sessions
CREATE TABLE survey_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table to store survey responses
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    question_key TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store generated prompts
CREATE TABLE generated_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    prompt_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store search results
CREATE TABLE search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    prompt_id UUID REFERENCES generated_prompts(id),
    book_id TEXT NOT NULL,
    similarity_score FLOAT NOT NULL,
    rank_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store user feedback on search results
CREATE TABLE search_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES survey_sessions(id),
    search_result_id UUID REFERENCES search_results(id),
    is_relevant BOOLEAN,
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_survey_responses_session ON survey_responses(session_id);
CREATE INDEX idx_generated_prompts_session ON generated_prompts(session_id);
CREATE INDEX idx_search_results_prompt ON search_results(prompt_id);
CREATE INDEX idx_search_results_session ON search_results(session_id);
CREATE INDEX idx_search_feedback_result ON search_feedback(search_result_id); 