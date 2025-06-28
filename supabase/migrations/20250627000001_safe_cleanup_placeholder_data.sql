-- =============================================================================
-- SAFE CLEANUP PLACEHOLDER DATA MIGRATION
-- =============================================================================
-- Removes old placeholder and sample data in the correct order to respect foreign keys

-- Clean up dependent data first (data that references other tables)

-- Clean up monitoring data with placeholder UUIDs
DELETE FROM public.monitoring_entries 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up any sample mood entries
DELETE FROM public.mood_entries 
WHERE user_id IN (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003',
    '00000000-0000-4000-a000-000000000004',
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample journal entries
DELETE FROM public.journal_entries 
WHERE user_id IN (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003',
    '00000000-0000-4000-a000-000000000004',
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample chat history
DELETE FROM public.chat_messages 
WHERE user_id IN (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003',
    '00000000-0000-4000-a000-000000000004',
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample assessments
DELETE FROM public.assessments 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample therapy sessions
DELETE FROM public.therapy_sessions 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample tasks
DELETE FROM public.client_tasks 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up sample notes
DELETE FROM public.therapy_notes 
WHERE client_id IN (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-b000-000000000002',
    '00000000-0000-4000-b000-000000000003',
    '00000000-0000-4000-b000-000000000004'
);

-- Clean up therapist records (these may reference profiles)
DELETE FROM public.therapist 
WHERE email LIKE '%@mindtwin.demo';

-- Clean up client records (these may reference profiles)
DELETE FROM public.clients 
WHERE email LIKE '%@mindtwin.demo';

-- Clean up profiles that are sample data
DELETE FROM public.profiles 
WHERE email LIKE '%@mindtwin.demo'
OR first_name IN ('Mario', 'Luigi', 'Anna', 'Laura', 'Marco', 'Sofia', 'Luca', 'Giulia')
OR last_name IN ('Rossi', 'Verdi', 'Bianchi', 'Neri', 'Ferrari', 'Romano', 'Marino', 'Costa');

-- Clean up profiles with test/sample emails
DELETE FROM public.profiles 
WHERE email LIKE '%test%' 
OR email LIKE '%sample%' 
OR email LIKE '%example%' 
OR email LIKE '%placeholder%';

-- Finally, clean up auth users (this should be last)
DELETE FROM auth.users 
WHERE email LIKE '%@mindtwin.demo'
OR email LIKE '%test%' 
OR email LIKE '%sample%' 
OR email LIKE '%example%' 
OR email LIKE '%placeholder%';

-- Note: We're keeping the demo.client@zentia.app and demo.therapist@zentia.app accounts
-- as these are the current working demo accounts for the application

-- Add a comment to track this cleanup
COMMENT ON SCHEMA public IS 'Placeholder data safely cleaned up on 2025-06-27. Only production-ready demo accounts remain.'; 