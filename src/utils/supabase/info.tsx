/* Configuration for Supabase values used by the frontend.
	Prefer reading these from Vite environment variables so the production
	deployment can set them without changing source. Fallbacks are kept to
	the previously-known values for convenience in local dev.
*/

const envProjectId = (import.meta as any).env?.VITE_PROJECT_ID;
const envAnonKey = (import.meta as any).env?.VITE_PUBLIC_ANON_KEY;
const envFunctionSlug = (import.meta as any).env?.VITE_FUNCTION_SLUG;

// hard-coded fallback values:
export const projectId = envProjectId || "qlhdhtgpwwbjkksrnehk";
export const publicAnonKey =
  envAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaGRodGdwd3diamtrc3JuZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjI3MjAsImV4cCI6MjA3OTIzODcyMH0.nruSxT1y14nCno3LWB0Np7zV2nUfXoQH1Uyb7HiMtlU";

// 👇 IMPORTANT: default to "server" now, not "make-server-6ff8009f"
export const serverSlug = envFunctionSlug || "server";

export const serverUrl = `https://${projectId}.supabase.co/functions/v1/${serverSlug}`;
