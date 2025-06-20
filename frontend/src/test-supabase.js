// Test Supabase configuration
console.log('=== Supabase Configuration Test ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('Environment mode:', import.meta.env.MODE);
console.log('Available env vars:', Object.keys(import.meta.env));

import { supabase } from './lib/supabase.js';

// Test basic connection
supabase.from('projects').select('count').then(result => {
  console.log('Supabase connection test:', result);
}).catch(error => {
  console.error('Supabase connection error:', error);
});