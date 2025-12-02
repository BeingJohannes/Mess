// src/utils/supabase/info.tsx

// Hard-coded Supabase config for production
export const projectId = "qlhdhtgpwwbjkksrnehk";

export const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

// Edge function name we actually deploy
export const serverSlug = "server";

// This is what Home.tsx imports:
export const serverUrl = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;

// Optional alias if you want to use ALLCAPS elsewhere
export const SERVER_URL = serverUrl;