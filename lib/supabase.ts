// Supabase Client Setup Boilerplate
// Note: When you are ready to connect to a live database, install the client via: npm install @supabase/supabase-js

let supabaseClient: any = null;

try {
  // We use require/try-catch wrapper to prevent Next.js build errors when the package is not installed yet
  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  // Fail silently during compilation if package is not installed
}

// Fallback stub client for compilation and testing safety
export const supabase = supabaseClient || {
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: (data: any) => Promise.resolve({ data, error: null }),
    update: (data: any) => Promise.resolve({ data, error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  })
};
