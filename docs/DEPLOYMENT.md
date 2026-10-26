# ZentroMart AI Customer Support Platform: Deployment Guide

## 1. System Requirements

- **Python**: 3.10 or higher (Tested with Python 3.13)
- **Node.js**: v20 or higher (Tested with Node v24.19.0)
- **Package Managers**: `pip` and `npm`
- **Operating Systems**: macOS, Ubuntu / Debian Linux, Windows (WSL2 recommended)

---

## 2. Directory Structure & Environment Variables

### 2.1 Backend Environment (`backend/.env`)

Create `backend/.env` (or copy from `.env.example` in repository root):

```bash
# General Backend Settings
APP_ENV=production
DEBUG=false
DATASET_DIR=../Capstone_Project_Dataset_FTTT_2026
FRONTEND_ORIGIN=http://localhost:3000

# Optional Upstream LLM Configuration
LLM_PROVIDER=deterministic   # Options: deterministic, gemini, openai, anthropic
LLM_API_KEY=
LLM_MODEL=

# Optional Gnani Speech AI Integration
# Docs: https://docs.gnani.ai/api/introduction/introduction
GNANI_API_KEY=
GNANI_TOKEN=
GNANI_STT_URL=https://api.vachana.ai/stt/v3
GNANI_TTS_URL=https://api.vachana.ai/api/v1/tts/inference
```

### 2.2 Frontend Environment (`frontend/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 3. Local Development Setup

### Step 1: Clone and Validate Dataset
Ensure `Capstone_Project_Dataset_FTTT_2026/` exists at the root. Run the dataset integrity validator:

```bash
cd Capstone_Project_Dataset_FTTT_2026
python3 validate_dataset.py
cd ..
```
*Expected Output:* `ALL DATASET CHECKS PASSED!`

### Step 2: Install Backend Dependencies & Start FastAPI
```bash
# In repository root
pip install -r backend/requirements.txt

# Start backend server
PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now live at `http://localhost:8000`.
- Health check: `http://localhost:8000/health`
- Integration diagnostics: `http://localhost:8000/api/health/integrations`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

### Step 3: Install Frontend Dependencies & Start Next.js
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. Running Automated Tests

Run the complete backend test suite:
```bash
PYTHONPATH=backend python3 -m pytest backend/tests -v
```
*Expected Result:* 31 passed in <1s.

Run the automated evaluation benchmarks:
```bash
# Single Questions Benchmark (52 cases)
python3 -c "import asyncio, sys; sys.path.insert(0, 'backend'); from app.services.evaluation import evaluation_runner; res = asyncio.run(evaluation_runner.evaluate_questions()); print(f'Passed: {res[\"passed\"]}/{res[\"total_cases\"]} ({res[\"accuracy_pct\"]}%)')"

# Multi-Turn Conversations Benchmark (23 cases)
python3 -c "import asyncio, sys; sys.path.insert(0, 'backend'); from app.services.evaluation import evaluation_runner; res = asyncio.run(evaluation_runner.evaluate_conversations()); print(f'Passed: {res[\"passed_conversations\"]}/{res[\"total_conversations\"]} ({res[\"accuracy_percent\"]}%)')"
```

---

## 5. Production Build

### Frontend Production Build
```bash
cd frontend
npm run build
npm run start
```
The optimized production server will listen on port 3000.

---

## 6. Production Deployment Options

### Option A: Cloud Architecture — Vercel (Frontend) + Render (FastAPI Backend)

ZentroMart AI features a decoupled architecture:
1. **Frontend**: Next.js 16 (React 19, TypeScript) deployed serverlessly on **Vercel**.
2. **Backend**: Python 3.10+ FastAPI service deployed as a web service on **Render** (or Fly.io / Railway / AWS).

#### 1. Next.js Frontend Deployment on Vercel
1. In your Vercel Dashboard, click **Add New** -> **Project** and import `krishporwal011/ZentroMartAI`.
2. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder, or leave default as root since `vercel.json` and root `package.json` are provided)*
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL, e.g. `https://zentromart-backend.onrender.com` (do not add a trailing slash).
   - *Security Note*: Never place private API keys (`TINYFISH_API_KEY`, `SARVAM_API_KEY`, `OPENAI_API_KEY`) in frontend variables. All keys remain private in the backend.

#### 2. FastAPI Backend Deployment on Render
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository `krishporwal011/ZentroMartAI`.
3. Configure the Web Service:
   - **Name**: `zentromart-backend`
   - **Runtime**: `Python 3`
   - **Root Directory**: `.` (leave as repository root to include dataset files)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables on Render**:
   - `APP_ENV`: `production`
   - `DATASET_DIR`: `Capstone_Project_Dataset_FTTT_2026`
   - `FRONTEND_ORIGIN`: Your production Vercel URL (e.g., `https://zentromart-ai.vercel.app`)
   - `TINYFISH_API_KEY`: *(Optional upstream API key for live web agent executions)*
   - `SARVAM_API_KEY`: *(Optional upstream API key for live Indian language STT/TTS)*
   - `OPENAI_API_KEY`: *(Optional upstream API key for GPT models)*

---

### Option B: Docker Compose Deployment

Create `docker-compose.yml` in the repository root:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATASET_DIR=/app/Capstone_Project_Dataset_FTTT_2026
      - FRONTEND_ORIGIN=http://localhost:3000
      - GNANI_API_KEY=${GNANI_API_KEY}
    volumes:
      - ./Capstone_Project_Dataset_FTTT_2026:/app/Capstone_Project_Dataset_FTTT_2026:ro
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend
    restart: always
```

### Option B: Systemd Service Configuration (Linux Server)

**/etc/systemd/system/zentromart-backend.service**:
```ini
[Unit]
Description=ZentroMart Support Backend API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/zentromart
Environment="PYTHONPATH=/var/www/zentromart/backend"
EnvironmentFile=/var/www/zentromart/backend/.env
ExecStart=/usr/local/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

**/etc/systemd/system/zentromart-frontend.service**:
```ini
[Unit]
Description=ZentroMart Support Next.js Frontend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/zentromart/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 7. Reverse Proxy & SSL Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name support.zentromart.internal;

    # Frontend Next.js Proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend FastAPI Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 8. Troubleshooting & Health Verification

1. **CORS Errors**: Ensure `FRONTEND_ORIGIN` in `backend/.env` matches the exact scheme and port of the frontend URL (e.g., `http://localhost:3000`).
2. **Missing Voice Credentials**: If `GNANI_API_KEY` is omitted, the frontend voice recorder will display a clear "Configuration Required" status badge. Text chat, order tracking, and escalation will continue to function normally.
3. **Dataset Path Resolution**: If `validate_dataset.py` fails to locate CSV files, check that `DATASET_DIR` points to the folder containing `data/` and `kb/`.
