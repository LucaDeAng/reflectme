-- =============================================================================
-- CLEANUP PLACEHOLDER DATA MIGRATION
-- =============================================================================
-- Removes all old placeholder and sample data, keeping only current demo accounts

-- Delete old mindtwin.demo accounts (these will be replaced with cleaner demo accounts)
DELETE FROM auth.users 
WHERE email LIKE '%@mindtwin.demo';

-- Delete old sample profiles
DELETE FROM public.profiles 
WHERE email LIKE '%@mindtwin.demo'
OR first_name IN ('Mario', 'Luigi', 'Anna', 'Laura', 'Marco', 'Sofia', 'Luca', 'Giulia')
OR last_name IN ('Rossi', 'Verdi', 'Bianchi', 'Neri', 'Ferrari', 'Romano', 'Marino', 'Costa');

-- Delete old therapist records
DELETE FROM public.therapist 
WHERE email LIKE '%@mindtwin.demo';

-- Delete old client records
DELETE FROM public.clients 
WHERE email LIKE '%@mindtwin.demo';

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

-- Clean up any other sample data with test emails
DELETE FROM public.profiles 
WHERE email LIKE '%test%' 
OR email LIKE '%sample%' 
OR email LIKE '%example%' 
OR email LIKE '%placeholder%';

-- Note: We're keeping the demo.client@zentia.app and demo.therapist@zentia.app accounts
-- as these are the current working demo accounts for the application

-- Add a comment to track this cleanup
COMMENT ON SCHEMA public IS 'Placeholder data cleaned up on 2025-06-27. Only production-ready demo accounts remain.'; 