# JIS Frontend

Next.js 16 + React 19 frontend for the judicial information system.

## Prerequisites

- Node.js 20.9+
- pnpm 9+

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Create a local env file:

```bash
cp .env.example .env.local
```

3. Update required values in `.env.local`.

4. Start the app:

```bash
pnpm dev
```

5. Open http://localhost:3000.

## Environment Variables

The canonical template is `.env.example`.

Runtime variables used by the app:

- `NEXT_PUBLIC_API_URL` (required): Base URL of your backend API (for example `https://api.example.com`).
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (optional): Razorpay test key for lawyer closed-case payment flow.

Test-only variables used by Selenium (not required for Vercel runtime):

- `E2E_BASE_URL`
- `E2E_REGISTRAR_USER_ID`
- `E2E_JUDGE_USER_ID`
- `E2E_PASSWORD`
- `E2E_ELEMENT_TIMEOUT_MS`
- `E2E_TEST_TIMEOUT_MS`
- `E2E_DISABLE_WEB_SECURITY`
- `SELENIUM_BROWSER`
- `SELENIUM_REMOTE_URL`
- `SELENIUM_HEADLESS`

## Deploy on Vercel

This repository includes `vercel.json` with deterministic commands:

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`

Deploy steps:

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Ensure framework preset is Next.js.
4. In Vercel project settings, add environment variables:
   - `NEXT_PUBLIC_API_URL` (required)
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (optional)
5. Add those variables for Production and Preview (and Development if you use Vercel dev env sync).
6. Deploy.

Important:

- Any variable prefixed with `NEXT_PUBLIC_` is exposed to the browser and baked into the build output for that deployment.
- Do not commit `.env.local` or real secrets.

## Useful Scripts

- `pnpm dev`: Run local dev server
- `pnpm build`: Build production output
- `pnpm start`: Start production server locally
- `pnpm lint`: Run ESLint
- `pnpm test:selenium`: Run Selenium use case tests
