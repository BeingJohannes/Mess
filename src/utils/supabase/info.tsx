/* Configuration for Supabase values used by the frontend.
	Prefer reading these from Vite environment variables so the production
	deployment can set them without changing source. Fallbacks are kept to
	the previously-known values for convenience in local dev.
*/

export const projectId = "qlhdhtgpwwbjkksrnehk";

export const publicAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

export const serverSlug = "server";   // NEVER rely on env

export const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;
