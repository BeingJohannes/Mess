GitHub repository secrets required for CI deploy and Playwright E2E

Required secrets (add these under Repository Settings → Secrets & variables → Actions):

- SUPABASE_ACCESS_TOKEN
  - Must be a Supabase Personal Access Token that starts with `sbp_...` (not an anon key).
  - This token is used by the Supabase CLI in the GitHub Actions workflow to authenticate and deploy Edge Functions.
  - Create one in your Supabase project (Settings → API → Personal Access Tokens).

- SUPABASE_PROJECT_REF
  - Your Supabase project ref (the short id shown in the project URL and dashboard).
  - Example: `qlhdhtgpwwbjkksrnehk`

- VITE_PROJECT_ID
  - The same as `SUPABASE_PROJECT_REF` used by the front-end build (if referenced by Vite env vars).

- VITE_PUBLIC_ANON_KEY
  - The Supabase public anon key for your project (starts with `eyJ...` normally).
  - Used by the frontend to initialize the Supabase client for realtime and auth.

Optional, for E2E that uses OpenAI or other services:

- OPENAI_API_KEY
  - If you enable AI features in the server or tests.

How to add secrets quickly (copy/paste into GitHub UI):
1. Go to your repository on GitHub → Settings → Secrets and variables → Actions.
2. Click "New repository secret" and paste the name and value from above.
3. Make sure `SUPABASE_ACCESS_TOKEN` is an sbp_ token. The deploy step will fail if you provide the anon key.

After adding secrets:
- Re-run the GitHub Actions workflow (Actions → deploy workflow → Run workflow) or push a trivial commit to trigger it.
- If the workflow fails, paste the log here and I will help iterate on the failure.

Notes:
- The workflow expects `supabase/functions/deno.json` to reference `./server/index.ts` as the serve entry and includes an import map mapping `react/jsx-runtime` to a local stub. If you changed function layout, update `supabase/functions/deno.json` accordingly.
- If you want, I can also add guidance to rotate or revoke the `sbp_` token after testing (recommended for security).