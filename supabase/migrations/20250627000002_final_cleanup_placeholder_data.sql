-- =============================================================================
-- FINAL CLEANUP PLACEHOLDER DATA MIGRATION  
-- =============================================================================
-- Removes all placeholder and sample data based on actual database schema

-- Clean up sample monitoring entries first (they reference profiles)
DELETE FROM public.monitoring_entries 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002', 
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample micro wins
DELETE FROM public.micro_wins 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample mood entries
DELETE FROM public.mood_entries 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample journal entries
DELETE FROM public.journal_entries 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample AI suggestions log
DELETE FROM public.ai_suggestions_log 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample chat messages 
DELETE FROM public.chat_messages 
WHERE client_id IN (
    SELECT email FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample tasks
DELETE FROM public.tasks 
WHERE client_id IN (
    SELECT email FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up homework progress entries
DELETE FROM public.homework_progress 
WHERE client_id IN (
    SELECT email FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample chat tags
DELETE FROM public.chat_tags 
WHERE client_id IN (
    SELECT email FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample assessment reminders
DELETE FROM public.assessment_reminders 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample assessment results
DELETE FROM public.assessment_results ar
WHERE ar.assessment_id IN (
    SELECT a.id FROM public.assessments a
    WHERE a.client_id IN (
        SELECT id FROM public.profiles 
        WHERE email LIKE '%@mindtwin.demo'
        OR email LIKE '%test%'
        OR email LIKE '%sample%'
        OR email LIKE '%example%'
    )
);

-- Clean up sample assessments
DELETE FROM public.assessments 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample notifications
DELETE FROM public.notifications 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up sample notes
DELETE FROM public.notes 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up biometrics data
DELETE FROM public.biometrics_hourly 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up health oauth tokens
DELETE FROM public.health_oauth_tokens 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up summary cache
DELETE FROM public.summary_cache 
WHERE client_id IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%@mindtwin.demo'
    OR email LIKE '%test%'
    OR email LIKE '%sample%'
    OR email LIKE '%example%'
);

-- Clean up therapist client relations
DELETE FROM public.therapist_client_relations tcr
WHERE tcr.therapist_id IN (
    SELECT t.id FROM public.therapist t
    WHERE t.email LIKE '%@mindtwin.demo'
    OR t.email LIKE '%test%'
    OR t.email LIKE '%sample%'
    OR t.email LIKE '%example%'
) OR tcr.client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.email LIKE '%@mindtwin.demo'
    OR c.email LIKE '%test%'
    OR c.email LIKE '%sample%'
    OR c.email LIKE '%example%'
);

-- Clean up clients table
DELETE FROM public.clients 
WHERE email LIKE '%@mindtwin.demo'
OR email LIKE '%test%'
OR email LIKE '%sample%'
OR email LIKE '%example%';

-- Clean up therapist table  
DELETE FROM public.therapist 
WHERE email LIKE '%@mindtwin.demo'
OR email LIKE '%test%'
OR email LIKE '%sample%'
OR email LIKE '%example%';

-- Finally, clean up profiles (this should be last due to foreign key dependencies)
DELETE FROM public.profiles 
WHERE email LIKE '%@mindtwin.demo'
OR email LIKE '%test%'
OR email LIKE '%sample%'
OR email LIKE '%example%'
OR email LIKE '%placeholder%';

-- Clean up auth users (this should be very last)
DELETE FROM auth.users 
WHERE email LIKE '%@mindtwin.demo'
OR email LIKE '%test%'
OR email LIKE '%sample%'
OR email LIKE '%example%'
OR email LIKE '%placeholder%';

-- Note: We're keeping the demo.client@zentia.app and demo.therapist@zentia.app accounts
-- as these are the current working demo accounts for the application

-- Add a comment to track this cleanup
COMMENT ON SCHEMA public IS 'Final placeholder data cleanup completed on 2025-06-27. Only production-ready demo accounts remain.'; 