# ZENTRO MART — PRODUCTION DEPLOYMENT GUIDE

**Project:** ZENTRO MART Omnichannel Support & Operations Platform  
**Architecture:** Decoupled Architecture (Next.js 16 Frontend + FastAPI Backend)  
**Target Hosts:** Vercel (Frontend) & Render / Fly.io / Docker (Backend)  
**Date:** October 27, 2026  

---

## 1. Architecture & Deployment Overview

ZENTRO MART consists of two primary services communicating over secure HTTPS/JSON:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     FRONTEND (Vercel)           │   HTTPS   │      BACKEND (Render/Docker)    │
│  - Next.js 16.4.3 App Router    │──────────▶│  - FastAPI 0.115+ (Uvicorn)     │
│  - React 19 / Tailwind CSS v4   │  REST/CORS│  - In-Memory BM25 & Pandas      │
│  - Port: 443 (Edge CDN)         │◀──────────│  - Port: $PORT (Default 8000)   │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

---

## 2. Backend Deployment (Render / Docker / Linux VPS)

### 2.1 Render Web Service Setup

1. **Create Web Service:**
   - In the Render Dashboard, click **New +** -> **Web Service**.
   - Connect your Git repository.
2. **Service Configuration:**
   - **Environment:** `Python 3` (or `Docker`)
   - **Region:** Choose the region closest to your primary users (e.g., `Singapore` or `Frankfurt`).
   - **Branch:** `main`
   - **Root Directory:** Leave blank (repository root) or enter `.`
   - **Build Command:**
     ```bash
     pip install --upgrade pip && pip install -r backend/requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT --workers 2
     ```
3. **Health Check Endpoint:**
   - Path: `/api/health`
   - Expected Response: `{"status": "ok", "app": "ZentroMart API"}` (HTTP 200)

### 2.2 Backend Environment Variables
In the Render **Environment** tab, configure the following keys:

| Variable Name | Example Production Value | Description |
|---|---|---|
| `APP_ENV` | `production` | Enables production mode |
| `DEBUG` | `false` | Disables debug stack traces in responses |
| `DATASET_DIR` | `Capstone_Project_Dataset_FTTT_2026` | Path to CSV datasets |
| `FRONTEND_ORIGIN` | `https://zentro-mart.vercel.app` | Exact URL of your deployed frontend (for CORS) |
| `TINYFISH_API_KEY` | *(Optional)* `tf_live_...` | API key for cloud browser agent |
| `TINYFISH_API_URL` | `https://agent.tinyfish.ai/v1/agent/run`| Endpoint for TinyFish cloud runner |
| `TINYFISH_TIMEOUT` | `60.0` | Timeout in seconds |
| `GNANI_API_KEY` | *(Optional)* `gnani_key_...` | Gnani AI STT/TTS credentials |
| `GNANI_TOKEN` | *(Optional)* `gnani_token_...` | Gnani AI authentication token |

---

## 3. Frontend Deployment (Vercel)

### 3.1 Vercel Project Setup

1. **Import Repository:**
   - In the Vercel Dashboard, click **Add New...** -> **Project**.
   - Select the `ZENTRO_MART` repository.
2. **Project Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click Edit and select `frontend`.
   - **Build Command:** `npm run build` (or leave default `next build`)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
3. **Environment Variables:**
   Add the following environment variable in the Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: The public HTTPS URL of your deployed Render backend (e.g., `https://zentromart-backend.onrender.com`).

---

## 4. Docker Deployment (Alternative Self-Hosted Target)

A standardized multi-stage `Dockerfile` can be used to run the backend on any cloud container service:

```dockerfile
# Backend Dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy dataset and application code
COPY Capstone_Project_Dataset_FTTT_2026 ./Capstone_Project_Dataset_FTTT_2026
COPY backend ./backend

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run Commands:
```bash
# Build the container image
docker build -t zentromart-backend -f backend/Dockerfile .

# Run the container locally or in staging
docker run -d -p 8000:8000 \
  -e APP_ENV=production \
  -e FRONTEND_ORIGIN=http://localhost:3000 \
  --name zentromart-api zentromart-backend
```

---

## 5. Post-Deployment Smoke Test & Verification Checklist

Immediately following deployment, run the following smoke tests against your live endpoints:

1. **Verify Backend Health:**
   ```bash
   curl -i https://<YOUR_BACKEND_URL>/api/health
   # Expected: HTTP/2 200 OK, {"status": "ok", "app": "ZentroMart API"}
   ```

2. **Verify Integrations Health:**
   ```bash
   curl -i https://<YOUR_BACKEND_URL>/api/health/integrations
   # Expected: HTTP/2 200 OK, returns dataset, fastapi, and tinyfish status
   ```

3. **Verify CORS Headers:**
   ```bash
   curl -i -X OPTIONS https://<YOUR_BACKEND_URL>/api/orders/search \
     -H "Origin: https://<YOUR_FRONTEND_URL>" \
     -H "Access-Control-Request-Method: POST"
   # Expected: Access-Control-Allow-Origin matching your frontend origin
   ```

4. **Verify Frontend UI in Browser:**
   - Open `https://<YOUR_FRONTEND_URL>`.
   - Test Order Lookup with ID `ORD_1001` (Customer Phone `9876543210`).
   - Test Support Chat query: *"Can I return my unopened laptop purchased 4 days ago?"*.
   - Open the **Web Agent** tab and execute the Meta 10-K Debt-to-Equity preset.

---

## 6. Rollback Procedures

- **Frontend Rollback (Vercel):**
  - Navigate to **Deployments** in your Vercel Project.
  - Locate the previous successful deployment and click **Promote to Production** (instant zero-downtime rollback).
- **Backend Rollback (Render):**
  - In Render, go to **Deploys** and click **Rollback to this deploy** on the desired previous commit.
