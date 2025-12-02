Production deployment checklist

Goal: make the game available online (shareable URL) with the server (Supabase Edge Function) and the frontend deployed.

Recommended approach: Use the provided GitHub Actions workflow to deploy the function under slug `server` and publish the frontend to GitHub Pages.

1) Add required GitHub Secrets

  - SUPABASE_ACCESS_TOKEN: a CLI token that can deploy functions. Create via the Supabase Dashboard or use a service token.
  - SUPABASE_PROJECT_REF: your Supabase project ref (e.g., qlhdhtgpwwbjkksrnehk)
  - VITE_PROJECT_ID: same as SUPABASE_PROJECT_REF (the public project ref for the frontend)
  - VITE_PUBLIC_ANON_KEY: your Supabase public anon key (frontend safe)

  Optional (if you plan to deploy to a different host):
  - Add any host-specific secrets (Netlify, Vercel tokens).

2) Confirm the function entrypoint

  - Ensure `supabase/functions/server/index.tsx` exports the fetch handler:

    export default app.fetch

  - If you changed the file or use a different slug, adapt VITE_FUNCTION_SLUG accordingly.

3) Push to main

  - Commit and push your changes to `main`. The GitHub Actions workflow `.github/workflows/deploy.yml` will run automatically.

4) After the workflow completes

  - The frontend will be published to the `gh-pages` branch. The public URL will be:

    https://<your-github-username>.github.io/<repo-name>

  - Confirm the function is reachable at:

    https://<VITE_PROJECT_ID>.supabase.co/functions/v1/server/health

    Use the anonymous key as Authorization header (`Bearer <VITE_PUBLIC_ANON_KEY>`).

5) Alternative: Vercel / Netlify (recommended for faster CDN + TLS)

  - Connect your GitHub repo to Vercel or Netlify.
  - In the project settings, set Environment Variables:
    - VITE_PROJECT_ID
    - VITE_PUBLIC_ANON_KEY
    - VITE_FUNCTION_SLUG=server
  - Deploy: the host will run `npm run build` and serve the `build` directory.
  - For the Supabase function, either deploy via the Supabase dashboard or run the supabase CLI locally/CI to deploy the `server` slug.

6) Run tests

  - Locally you can run the headless simulation:

    serverUrl="https://<VITE_PROJECT_ID>.supabase.co/functions/v1/server" PUBLIC_ANON_KEY="<anon>" node scripts/multiplayer-sim.js

  - Or run the Playwright test (requires Playwright installed and chromium):

    export serverUrl="https://<VITE_PROJECT_ID>.supabase.co/functions/v1/server"
    export PUBLIC_ANON_KEY="<anon>"
    npm run test:e2e

Notes and troubleshooting

  - If public users report failing requests, check browser console network tab to see if requests go to the correct function path and include Authorization.
  - If you prefer the canonical function slug to be `server` in production, the workflow deploys that slug; make sure `VITE_FUNCTION_SLUG=server` is set in the environment used to build the frontend.
  - If you host the frontend on a custom domain, configure DNS and GitHub Pages or Vercel settings accordingly.

Security

  - Never commit service-role keys into the repo.
  - Keep the Supabase service token (if used) in CI secrets only.

If you'd like, I can:
- Convert the GitHub Actions workflow to deploy to Vercel or Netlify instead of GitHub Pages.
- Add automatic Playwright tests to the workflow (run after build, conditional on secrets present).
- Help you create the required Supabase CLI token (walkthrough).

Tell me which of the above you want me to do next and I will implement it.
