# AI Quota Proxy · Frontend

**Tollgate** is the web client of an AI consumption platform protected by a rate limiting proxy and a quota proxy. It is built with **React 18** and **Vite**, without UI libraries: every chart, meter and animation is hand made.

## Features

- Chat-like interface to send prompts to the simulated AI service.
- Live proxy chain that shows each request crossing `RateLimitProxyService`, `QuotaProxyService` and `MockAIGenerationService`, and where it was stopped.
- Quota indicator with a segmented progress bar of used versus available tokens, refreshed after every request and every five seconds.
- Requests per minute counter with a countdown dial until the window resets.
- When the rate limit is reached the send button is disabled and shows a countdown based on `Retry-After`.
- When the monthly quota runs out an upgrade modal opens with a simulated card payment.
- Bar chart with the daily usage of the last seven days.
- Plan badge with distinct colors for FREE, PRO and ENTERPRISE; the whole interface adopts the plan accent.
- Token estimator that shows the approximate cost of a prompt before sending it.
- Demo account switcher and a button to restore the demo data.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The backend must be running on the URL defined in `VITE_API_URL`.

## Environment variables

| Variable | Example |
| --- | --- |
| `VITE_API_URL` | `https://ai-quota-proxy-backend.onrender.com` |

## Deployment on Vercel

1. Import this repository in Vercel. The **Vite** preset is detected automatically.
2. Add the environment variable `VITE_API_URL` with the Render URL of the backend.
3. Deploy.

## Project structure

```
src/
  api/client.js          HTTP client and error mapping (429, 402)
  hooks/useQuota.js      Quota status polling and rate window countdown
  hooks/useNow.js        Shared clock
  components/            Chat, composer, meters, chart, modal and proxy chain
  utils/                 Token estimation and formatting
  styles.css             Design system
```
