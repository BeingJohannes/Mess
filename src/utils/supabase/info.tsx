// src/utils/supabase/info.tsx

// Your Supabase project ID
export const projectId = "qlhdhtgpwwbjkksrnehk";

// Public anon key (the one you're already using)
export const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

// The name of the Edge Function we know is healthy
export const serverSlug = "make-server-6ff8009f";

// Base URL that the rest of the app should use
export const serverUrl = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;

// Optional alias (uppercase) if any code imports SERVER_URL
export const SERVER_URL = serverUrl;