# my-react-ts-app

## Local development

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```

## Environment variables

Create `.env.local` for local and set:

```env
VITE_API_BASE_URL=https://localhost:7007/api/
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

For Azure Static Web Apps CI/CD, add the same values as GitHub Repository Secrets:

- `VITE_API_BASE_URL`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

## Deploy to Azure Static Web Apps

This repository is configured for SWA deployment with:

- `.github/workflows/azure-static-web-apps.yml`
- `staticwebapp.config.json` (SPA fallback for React Router)

### One-time setup

1. Create a Static Web App resource in Azure Portal.
2. Copy deployment token from Azure.
3. Add GitHub secret:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Add app env secrets listed above (`VITE_*`).

### Deploy flow

- Push to `main` -> GitHub Action builds and deploys to SWA.
- Pull requests -> preview environments are created automatically.

### Important notes

- App uses `BrowserRouter`, so direct URL refresh depends on `staticwebapp.config.json` fallback.
- Vite dev proxy (`vite.config.ts`) only works in local development, not in production.
- Production API must allow CORS for the SWA domain and support credentials if you rely on cookies.

