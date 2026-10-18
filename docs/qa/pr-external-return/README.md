# Festival sheet — external link return (WebKit 390)

Playwright captures the HTTP official-home label for PR QA.

```bash
npm run build
npx vite --host 127.0.0.1 --port 5173 --strictPort &
SMOKE_SITE_URL=http://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/korea-festival-external-return.spec.js --project=webkit-festival-external-return
```

Artifact: `http-official-label.png` (390×844 viewport clip).
