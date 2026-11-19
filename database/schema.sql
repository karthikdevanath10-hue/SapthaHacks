-- ==============================================================================
-- TruthLens Database Schema for Supabase (PostgreSQL)
-- AI-Powered Multimodal Digital Forensics & Deepfake Detection Platform
-- Problem Statement: PS04
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    organization TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Investigations Table
CREATE TABLE IF NOT EXISTS public.investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    image_storage_path TEXT,
    image_hash TEXT NOT NULL, -- SHA-256 hash for chain of custody and forensic integrity
    image_size_bytes BIGINT,
    mime_type TEXT,
    caption TEXT,
    source_context TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
    assessment TEXT NOT NULL, -- E.g. "No significant suspicious indicators detected", "Some indicators require further investigation", "Multiple suspicious indicators detected"
    indicator_score INTEGER DEFAULT 0, -- 0-100 aggregated suspicious indicator score (NOT probability of fake)
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Forensic Analysis Results Table
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    metadata_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    technical_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    caption_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_scorecard JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Forensic Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
    report_storage_path TEXT,
    report_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_investigations_user_id ON public.investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_investigations_hash ON public.investigations(image_hash);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON public.investigations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_inv_id ON public.analysis_results(investigation_id);
CREATE INDEX IF NOT EXISTS idx_reports_inv_id ON public.reports(investigation_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read, create, and delete their own forensic records
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Investigations Policies
CREATE POLICY "Users can view their own investigations"
    ON public.investigations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investigations"
    ON public.investigations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigations"
    ON public.investigations FOR DELETE
    USING (auth.uid() = user_id);

-- Analysis Results Policies
CREATE POLICY "Users can view analysis results for their investigations"
    ON public.analysis_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = analysis_results.investigation_id
        AND investigations.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert analysis results for their investigations"
    ON public.analysis_results FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = analysis_results.investigation_id
        AND investigations.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete analysis results for their investigations"
    ON public.analysis_results FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = analysis_results.investigation_id
        AND investigations.user_id = auth.uid()
    ));

-- Reports Policies
CREATE POLICY "Users can view reports for their investigations"
    ON public.reports FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = reports.investigation_id
        AND investigations.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert reports for their investigations"
    ON public.reports FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = reports.investigation_id
        AND investigations.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete reports for their investigations"
    ON public.reports FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.investigations
        WHERE investigations.id = reports.investigation_id
        AND investigations.user_id = auth.uid()
    ));

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        now(),
        now()
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
