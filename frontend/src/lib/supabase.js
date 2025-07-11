import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

// Helper function to handle Supabase auth
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helper functions
export const db = {
  // User sync function
  ensureUserExists: async (userId, email) => {
    console.log('🔄 Ensuring user exists in public.users table:', { userId, email });
    
    // First check if user exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId);
    
    if (checkError) {
      console.error('❌ Error checking user existence:', checkError);
      return { data: null, error: checkError };
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ User already exists in public.users');
      return { data: existingUsers[0], error: null };
    }
    
    // If user doesn't exist, create them
    console.log('📝 Creating user in public.users table');
    // Add dummy password_hash since it's required by the table
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: email,
        password_hash: 'supabase_auth_user', // Dummy value since we use Supabase Auth
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create user in public.users:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ User created in public.users:', data);
    }
    
    return { data, error };
  },

  // Projects
  getProjects: async (userId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    return { data, error }
  },

  createProject: async (userId, projectData) => {
    console.log('📝 Creating project with data:', { userId, projectData });
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('❌ No active session found:', sessionError);
      return { data: null, error: { message: 'No active session. Please log in again.' } };
    }
    
    console.log('🔐 Current session user:', session.user.id);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: userId,
        ...projectData
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Project creation error:', JSON.stringify(error, null, 2));
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        statusCode: error.statusCode
      });
    } else {
      console.log('✅ Project created successfully:', data);
    }
    
    return { data, error }
  },

  updateProject: async (projectId, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()
    
    return { data, error }
  },

  deleteProject: async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
    
    return { error }
  },

  // Locations
  getLocations: async (projectId) => {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        coordinates
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  createLocation: async (locationData) => {
    // Convert lat/lng to PostGIS point format
    const { latitude, longitude, ...rest } = locationData
    
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        ...rest,
        coordinates: `POINT(${longitude} ${latitude})`
      }])
      .select()
      .single()
    
    return { data, error }
  },

  updateLocation: async (locationId, updates) => {
    // Handle coordinate updates
    if (updates.latitude && updates.longitude) {
      const { latitude, longitude, ...rest } = updates
      updates = {
        ...rest,
        coordinates: `POINT(${longitude} ${latitude})`
      }
      delete updates.latitude
      delete updates.longitude
    }

    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single()
    
    return { data, error }
  },

  deleteLocation: async (locationId) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
    
    return { error }
  }
}

export default supabase