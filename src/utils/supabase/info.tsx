/* Configuration for Supabase values used by the frontend.
	Prefer reading these from Vite environment variables so the production
	deployment can set them without changing source. Fallbacks are kept to
	the previously-known values for convenience in local dev.
*/

// // Vite env variables (set VITE_PROJECT_ID, VITE_PUBLIC_ANON_KEY, VITE_FUNCTION_SLUG)
// const envProjectId = (import.meta as any).env?.VITE_PROJECT_ID;
// const envAnonKey = (import.meta as any).env?.VITE_PUBLIC_ANON_KEY;
// const envFunctionSlug = (import.meta as any).env?.VITE_FUNCTION_SLUG;

// export const projectId = envProjectId || "qlhdhtgpwwbjkksrnehk";
// export const publicAnonKey = envAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

// // Allow switching function slug at deploy-time. Recommended production slug: "server"
// export const serverSlug = envFunctionSlug || "make-server-6ff8009f";
// export const serverUrl = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;

// src/utils/supabase/info.tsx

// We know this is your real project:
export const projectId = "qlhdhtgpwwbjkksrnehk";

// We know this anon key works with your project:
export const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

// And we’ll **officially** use the make-server-6ff8009f function as the backend:
export const serverSlug = "make-server-6ff8009f";

// This is the URL all frontend calls will use:
export const serverUrl = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;
