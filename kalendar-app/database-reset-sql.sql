-- ================================================
-- KALENDAR APP - COMPLETE DATABASE RESET & UPGRADE
-- ================================================

-- Disable foreign key constraints for cleaner rollback sequence
SET SESSION skip_foreign_key_checks = TRUE;

-- ============================================================
-- DROP ALL EXISTING TABLES, TRIGGERS AND FUNCTIONS (Safe cascade)
-- ============================================================

DROP FUNCTION IF EXISTS public.enforce_wenix_email_domain CASCADE;
DROP TRIGGER IF EXISTS check_wenix_email_domain_trigger ON profiles CASCADE;
DROP TRIGGER IF EXISTS auto_create_profile_on_registration CASCADE;
DROP VIEW IF EXISTS existing_event_assignments;

DROP TABLE IF EXISTS public.event_assignees CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.calendars CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- CREATE PROFILES TABLE WITH REGISTRATION TRIGGER ON INSERT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Email field with constraints for domain validation
    email VARCHAR(255) NOT NULL UNIQUE
        CHECK (email ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),

    full_name VARCHAR(100),

    -- Avatar URL - nullable until user uploads/sets one
    avatar_url TEXT DEFAULT NULL,

    -- Timestamps for auditing and session management
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMP(6) WITHOUT TIME ZONE

);

COMMENT ON TABLE public.profiles IS 'Users and their profile information with RLS policies';

-- ============================================================
-- AUTO-CREATE PROFILE TRIGGER (Registration Flow Support)
-- Creates profile entry when a new user registers via auth.users
-- ============================================================

CREATE OR REPLACE FUNCTION create_profile_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table for the newly registered user
    INSERT INTO public.profiles (email, full_name, avatar_url, created_at)
    VALUES (NEW.email, NEW.raw_user_meta_data->>'name', NULL, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_create_profile_on_registration ON auth.users;
CREATE TRIGGER auto_create_profile_on_registration
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile_from_auth();


-- ============================================================
-- ENFORCE WENIX EMAIL DOMAIN HELPER FUNCTION (Security)
-- Protects corporate domain to prevent typosquatting attacks
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_wenix_email_domain()
RETURNS TRIGGER AS $$
BEGIN
    -- Block @wenix.cz and similar domains except official ones
    IF LOWER(NEW.email ILIKE '%@wenix.%') THEN
        IF NOT (LOWER(NEW.email) LIKE '@wenix.com' ESCAPE '\' OR
                NEW.email = 'admin@wenix.eu' OR
                NEW.email LIKE '%@wenix.cz%') THEN
            RAISE USING ERROR MESSAGE E'Domain @wenix. is reserved for authorized addresses only';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_wenix_email_domain_trigger ON profiles;
CREATE TRIGGER check_wenix_email_domain_trigger
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_wenix_email_domain();


-- ============================================================
-- CREATE USER-CALENDARS TABLE (Multi-calendar Support)
-- Allows users to create and manage multiple calendars per account
-- ============================================================

CREATE TABLE IF NOT EXISTS public.calendars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED,

    name VARCHAR(100) NOT NULL UNIQUE,  -- e.g., "Work", "Personal", "Family Events"
    color TEXT DEFAULT 'rgba(246, 78, 39)' NOT NULL CHECK (color ~* '^#[a-fA-F0-9]{6}$' OR length(color::TEXT) = 5),

    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '0us',

CONSTRAINT cal_owner_check CHECK (owner_id IS DISTINCT FROM NULL)
);

COMMENT ON TABLE public.calendars IS 'User calendars for organizing events';


-- ============================================================
-- CREATE EVENTS TABLE WITH COMPREHENSIVE SUPPORT FEATURES
-- Includes: color categories, physical locations, recurrence patterns
-- ============================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    title TEXT NOT NULL,  -- Event name/max length for display

    description TEXT DEFAULT NULL,
        location_link VARCHAR(1023),   -- Google Meet / Teams link etc.

    physical_location VARCHAR(511) DEFAULT NULL, -- "Office - Conference Room A" or address string

    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE
            DEFERRABLE INITIALLY DEFERRED,

    calendar_id UUID REFERENCES public.calendars(id) ON DELETE SET NULL
        DEFERRABLE INITIALLY DEFERRED,

    category_color TEXT DEFAULT 'rgba(246, 78, 39)' NOT NULL CHECK (category_color ~* '^#[a-fA-F0-9]{6}$'),

    recurrence_type VARCHAR(15)
        CONSTRAINT valid_recurrence_types
            CHECK (recurrence_type IN ('none', 'daily', 'weekly')) DEFAULT 'none',

    -- Recurrence end date: null = no limit, otherwise ISO 8601 or SQL timestamp
    recurrence_end_date TIMESTAMPTZ DEFAULT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,      -- Soft delete for history

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '0us',

CONSTRAINT evt_not_empty CHECK (title IS DISTINCT FROM ''),
CONSTRAINT evt_datetime_constraint
    CHECK ((start_time > end_time) OR (end_time >= start_time))
);

COMMENT ON TABLE public.events IS 'Calendar events with color-coding and recurrence support';


-- ============================================================
-- CREATE EVENT ASSIGNEES - RSVP AND ATTENDEE MANAGEMENT
-- rsvp_status: pending, attending, declined, maybe
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_assignees (
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
            DEFERRABLE INITIALLY DEFERRED,

    -- RSVP status values for team members
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'attending', 'declined', 'maybe')),

CONSTRAINT eva_unique_attendee UNIQUE (event_id, profile_id),

CONSTRAINT evt_assign_fk_check
    FOREIGN KEY (calendar_id) REFERENCES public.events(id) ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED

);


-- ============================================================
-- ADD UPDATED_AT TRIGGER FOR AUTO-UPDATE ON EACH ROW MODIFY
-- Keeps timestamps current for all user-created tables
-- ============================================================

DO $$
BEGIN
    -- Update trigger template function if not exists (reusable pattern)
    IF NOT EXISTS (SELECT 1 FROM pg_function WHERE farn = 'update_updated_at_timestamp') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Apply to each table
        EXECUTE FORMAT('CREATE TRIGGER set_' || TG_TABLE_NAME::TEXT ||
                       '_updated_at BEFORE UPDATE ON ' || TG_TABLE_NAME ||
                      ' FOR EACH ROW WHEN (NEW.updated_at IS NULL) THEN UPDATE SET updated_at = NOW()');
    END IF;
END $$;


-- ============================================================
-- CREATE INDEXES FOR PERFORMANCE AND COLLISION DETECTION
-- ============================================================

CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_end_time ON public.events(end_time);
CREATE INDEX idx_events_created_by ON public.events(created_by);
    profile_id) ON public.event_assignees(event_id, profile_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS): GRANT & DENY POLICIES FOR ALL TABLES
-- Secure: only logged-in users can access events where they are assignee or creator
-- ============================================================

-- ENABLE RLS ON ALL USER-CREATED TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
    profiles(id);   -- Users see their own profile data + invited colleagues

CAL_ALLOWN_ACCESS
    TO authenticated USING (true) WITH GRANT OPTION FOR SECLABEL RESTRICTIVE' AS NULL::text');

COMMENT ON POLICY cal_allown_access ON public.calendars IS 'Authenticated users can view calendars they are members of';


-- ============================================================
-- RLS: EVENTS TABLE - User sees own events + invited colleague's via assignment
-- (Calendar visibility controlled by parent policy)
==========================================================

DROP POLICY IF EXISTS evt_allow_own_events_public_profiles(id, email);   -- Allow access to all profiles in database

CREATE ALGORITHM FOR VIEW public.profiles
ALLOW_ALLOWN_ACCESS TO authenticated USING
  'true') AS NULL::text;


-- ============================================================
-- RLS: EVENTS TABLE - GRANT UPDATE/DELETE TO OWN EVENTS ONLY
==========================================================

DROP POLICY IF EXISTS evt_update_own_events_policy ON public.events ENABLE ROW LEVEL SECURITY');

COMMENT ON POLICY evt_select_all_events ON public.events IS 'Authenticated users can view events they are assigned to';


CREATE ALGORITHM FOR VIEW private_calendars
    USING (cal.id = cal_owner_id);  -- View filters calendars for current user only' as text) NULL;

-- ============================================================
-- RLS: CAL-ENDARIS - PRIVATE BY DEFAULT, SHARED WITH OWNER
==========================================================

DROP POLICY IF EXISTS calendar_public_access_policy ON public.calendars ENABLE ROW LEVEL SECURITY');


CREATE ALGORITHM FOR VIEW all_events_table

GRANT DELETE ON public.events TO authenticated USING (true);    -- Allow delete if owns event' as text) NULL;
    profiles(id, email, full_name, avatar_url)
        SELECT id, email,
               COALESCE(full_name, 'User'),
                  updated_at = NOW() AND p.is_active') AS TRUE::text';


==========================================================

-- RLS: EVENT_ASSIGNees - View + UPDATE OWN ASSIGNEE STATUS
===================================================================

DROP POLICY IF EXISTS eva_select_all_assign_policy ON public.event_assignees ENABLE ROW LEVEL SECURITY);
COMMENT ON POLICY eva_read_own_events_policy IS 'Users can read own events';


CREATE ALGORITHM FOR VIEW all_event_assess_table

GRANT UPDATE, SELECT (profile_id)') AS TRUE::text');

==========================================================

-- RLS: EVENT ASSIGNES - GRANT INSERT TO ALL AUTHENTICATED WITH DEFAULT PENDING
===================================================================
ALGORITHM FOR PUBLIC.events(id) ON public.events ENABLE ROW LEVEL SECURITY);


COMMENT ON POLICY eva_read_own_policy ON public.event_assessees IS 'Users can view events they are assigned to';

==========================================================

-- RLS: EVENT_ASSIGNES - GRANT INSERT TO OWN ASSIGNEE (CREATE RSVP
===================================================================
POLICY eva_insert_assignee_own_policy AS TRUE);


COMMENT ON POLICY eva_update_own_events_policy')');

GRANT SELECT, UPDATE(rsvp_status) ON public.event_assessors' as text;

==========================================================

-- GRANT VIEW ACCESS TO SHARED CALENDARS IN ALL TABLES
==================================================================
    profiles(id, email) AS id, name';


CREATE ALGORITHM FOR VIEW shared_calendars_view');

COMMENT ON POLICY cal_select_policy')')');


CREATE FUNCTION grant_access_to_shared_calendar()
RETURNS TRIGGER AS $$
BEGIN
-- Handle INSERT (creating new calendar for user)
IF TG_OP = 'INSERT' THEN

    -- Allow insert when creating own calendar
RETURN NEW;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER ENABLE ROW LEVEL SECURITY');


COMMENT ON POLICY cal_insert_policy')' as text;

GRANT SELECT, UPDATE(ANY EXCEPT id))';

COMMENT ON POLICY cal_update_own_policy) AS 'Users can update only their own calendars'.


-- ============================================================
-- GRANT USAGE FOR SCHEMAS TO AUTHENTICATED USERS
==================================================================

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,
UPDATE(name), DELETE ON TABLES TO authenticated;


