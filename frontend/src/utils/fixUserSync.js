import { supabase } from '../lib/supabase';

// Manual user sync utility
export async function manualUserSync() {
  try {
    console.log('🔧 Starting manual user sync...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ No active session found');
      return { success: false, error: 'No active session' };
    }
    
    const userId = session.user.id;
    const email = session.user.email;
    
    console.log('👤 Current user:', { userId, email });
    
    // Check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error checking user:', checkError);
      return { success: false, error: checkError };
    }
    
    if (existingUser) {
      console.log('✅ User already exists in public.users:', existingUser);
      return { success: true, data: existingUser };
    }
    
    // Create user in public.users
    console.log('📝 Creating user in public.users...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: email,
        password_hash: 'supabase_auth_user', // Dummy value since we use Supabase Auth
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create user:', createError);
      return { success: false, error: createError };
    }
    
    console.log('✅ User created successfully:', newUser);
    return { success: true, data: newUser };
    
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Add this function to window for easy access from console
if (typeof window !== 'undefined') {
  window.manualUserSync = manualUserSync;
}