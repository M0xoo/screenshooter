# Screenshoter

Local web app: capture a screenshot of any public HTTPS page with [Playwright](https://playwright.dev/), then compose a shareable PNG with customizable background, padding, shadows, optional window chrome, and text overlay.

## Requirements

- Node.js 20+
- Network access for the pages you capture

## Setup

```bash
npm install
npx playwright install chromium
npm run build -w shared
```

On Apple Silicon, if capture fails with “Executable doesn’t exist”, run `npx playwright install chromium` again so the correct browser build is downloaded for your CPU.

The `shared` package must be built so the server can import `@screenshoter/shared`. The `npm run dev` script builds `shared` automatically before starting the client and server.

## Run

```bash
npm run dev
```

- UI: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- API: proxied as `/api` from Vite to the Node server. By default the server listens on **3001**; if that port is already in use, `npm run dev` picks the next free port and prints it (the Vite proxy follows the same port).

Set `PORT` to prefer a different starting port (for example `PORT=4000 npm run dev` tries 4000, then 4001, …).

## Limitations

- **Auth and paywalls**: Pages that require login, cookies, or heavy bot blocking may not capture correctly.
- **Full page**: Very tall pages are capped server-side to reduce memory use.
- **Private networks**: URLs that resolve to private IP ranges are rejected (SSRF protection).

## Production build

```bash
npm run build
```

Run the API with `npm run start -w server` after building; serve the client `client/dist` with any static host, and proxy `/api` to the server.
