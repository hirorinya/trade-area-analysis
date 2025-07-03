-- Fix users table and sync with auth.users
-- Run this in Supabase SQL Editor

-- 1. First, let's check if the users table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- 2. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create a function to automatically sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at)
    VALUES (new.id, new.email, new.created_at)
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a trigger to automatically create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Sync existing auth.users to public.users
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 7. Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policy for users to read their own data
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 9. Create RLS policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 10. Check if the specific user exists and create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = 'd3850926-ae75-4e7c-88a4-a47354a53c51') THEN
        -- Check if password_hash column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'password_hash') THEN
            INSERT INTO public.users (id, email, password_hash)
            VALUES ('d3850926-ae75-4e7c-88a4-a47354a53c51', 
                    'bananas.go.bananas@gmail.com',
                    'supabase_auth_user');
        ELSE
            INSERT INTO public.users (id, email)
            VALUES ('d3850926-ae75-4e7c-88a4-a47354a53c51', 'bananas.go.bananas@gmail.com');
        END IF;
    END IF;
END $$;

-- 11. Verify the user now exists
SELECT * FROM public.users WHERE id = 'd3850926-ae75-4e7c-88a4-a47354a53c51';

-- 12. Check projects table RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';