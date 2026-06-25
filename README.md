# AI-Powered Industrial Safety Intelligence Platform (ISIP)

A production-ready safety intelligence platform combining real-time industrial telemetry simulation, predictive hazard classification, anomaly detection, alert rules dispatching, a RAG-powered safety manuals advisor, and automated AI incident report generators.

---

## 🛠️ Technology Stack & Core Modules

The platform is divided into a high-performance Python FastAPI backend and a responsive glassmorphic React frontend.

### 1. Backend Modules (Python)
- **FastAPI Core**: Handles API routers, logging middleware, CORS bindings, and Swagger documentation.
- **Risk Engine**: Combines a trained Scikit-Learn `RandomForestRegressor` (to predict raw risk percentages) and an unsupervised `IsolationForest` (to compute real-time anomaly scores). If pre-trained models are missing, the server auto-trains them on startup.
- **Alert Engine**: Implements threshold safety rules (e.g. Gas > 85 ppm, Temperature > 100°C, Risk > 75%, and PPE violations) to dispatch structured alarms concurrently.
- **SafetyGPT (RAG)**: Integrates LangChain, FAISS, and Google's Gemini API (`models/text-embedding-004` and `gemini-1.5-flash`) to parse uploaded PDFs, store them in a local vector database, and answer questions strictly based on the manuals.
- **AI Incident Report Generator**: Utilizes Gemini's structured output capability (`with_structured_output`) to generate Pydantic-validated incident reports (Summary, Root Cause, Action Items, and SOPs) from telemetry violations.
- **Sensor Simulator**: A thread-safe CLI script that simulates industrial telemetry streams and pushes data to `/predict` every 5 seconds, triggering hazard scenarios.

### 2. Frontend Modules (React + Vite)
- **Dashboard**: Live telemetry cards, neon trend charts (Recharts), and a simulator override console.
- **Alert Annunciator**: SCADA-style grid with Web Audio horn alarms, status filtering, and acknowledgement actions.
- **Risk Analytics**: Department-wide risk distributions, mechanical-thermal correlation scatter charts, and exposure comparisons.

---

## 📂 Project Directory Structure

```text
ISIP/
├── backend/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/       # Route handlers (incidents, prediction, chat)
│   │   │   └── router.py        # Central router registrations
│   │   ├── deps.py              # FastAPI dependency injections
│   │   └── schemas/             # Pydantic validation schemas
│   ├── data/                    # SQLite databases, FAISS indices, and model binaries
│   ├── models/                  # SQLAlchemy ORM models
│   ├── rag/                     # Ingestion processors and LangChain chain sequences
│   ├── services/                # Business logic (alert engine, report generators)
│   ├── utils/                   # Shared configurations and logging utilities
│   ├── .env.example             # Template file for credentials
│   ├── main.py                  # FastAPI entry point
│   ├── sensor_simulator.py      # Telemetry generator CLI script
│   └── requirements.txt         # Backend python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI elements (Header, charts)
│   │   ├── pages/               # Dashboard, Alerts, and Risk Analytics panels
│   │   ├── services/            # Axios API client integrations
│   │   ├── App.jsx              # App layout and routing
│   │   └── index.css            # Tailwind directives and neon glow styles
│   └── vite.config.js           # Reverse proxy configuration
│
├── start-platform.ps1           # Single-command startup script
└── README.md                    # Core documentation
```

---

## 🏗️ Architecture Design & Data Flow

Below is the diagram illustrating the end-to-end data pipeline:

```mermaid
graph TD
    subgraph Client [React Frontend Dashboard]
        Dash[Dashboard View]
        Annunc[Alert Annunciator]
        RAGChat[SafetyGPT Chat]
        AIReport[Incident Report View]
    end

    subgraph Simulation [Simulator CLI]
        Sim[sensor_simulator.py]
    end

    subgraph Backend [FastAPI Server]
        API[API Routers]
        
        subgraph ML [Intelligence Models]
            RF[RandomForest Risk Regressor]
            IF[IsolationForest Anomaly Detector]
        end
        
        subgraph Rules [Validation Layer]
            AE[Alert Engine]
        end
        
        subgraph RAG [Retrieval-Augmented Generation]
            FAISS[FAISS Vector Store]
            GeminiEmbed[GoogleGenAIEmbeddings]
            GeminiFlash[Gemini 1.5 Flash Chat LLM]
            RAGChain[RAGSafetyChain]
        end
        
        subgraph Gen [Report Generator]
            RepGen[IncidentReportGenerator]
        end
        
        DB[(SQLite Database)]
    end

    Sim -->|POST /predict (Telemetry)| API
    API --> ML
    ML -->|Risk Score + Anomaly Status| AE
    AE -->|Consolidated Alerts| API
    API -->|Persist Logged Incidents| DB
    DB -->|Dashboard Metrics| API
    
    %% Dashboard bindings
    API -->|Telemetry, Logs, & Alerts| Dash
    API -->|SCADA Horn & Ack| Annunc
    
    %% SafetyGPT & AI Generator bindings
    API -->|POST /chat/query| RAGChain
    RAGChain --> FAISS
    RAGChain --> GeminiFlash
    
    API -->|POST /incidents/ai-report| RepGen
    RepGen --> GeminiFlash
```

---

## 📡 API Documentation & Contracts

All backend endpoints are documented natively under `/docs` on the FastAPI server via Swagger. Below are details for key platform integrations:

### 1. Risk Prediction & Telemetry Check
- **Endpoint**: `POST /predict` (also mounted at `POST /api/v1/predict`)
- **Description**: Calculates raw and anomaly risks, checks alert thresholds, and dispatches safety alarms.
- **Request Format**:
  ```json
  {
    "temperature": 90.5,
    "gas_level": 80.2,
    "humidity": 75.0,
    "vibration": 60.1,
    "worker_count": 25,
    "shift": "night",
    "ppe_compliance": 0
  }
  ```
- **Response Format**:
  ```json
  {
    "predicted_risk": 82.0,
    "anomaly_risk": 90.0,
    "final_risk": 85.0,
    "risk_level": "CRITICAL",
    "alerts": [
      {
        "alert_type": "PPE_VIOLATION",
        "severity": "HIGH",
        "message": "CRITICAL WARNING: Workers on shift are violating PPE requirements."
      },
      {
        "alert_type": "COMPOSITE_RISK",
        "severity": "CRITICAL",
        "message": "EMERGENCY: Final blended safety risk score has breached 75% threshold."
      }
    ]
  }
  ```

### 2. AI Incident Report Generator
- **Endpoint**: `POST /api/v1/incidents/ai-report`
- **Description**: Compiles a structured, comprehensive incident analysis using the Gemini API based on telemetry parameters.
- **Request Format**:
  ```json
  {
    "final_risk": 90.0,
    "temperature": 105.0,
    "gas_level": 95.0,
    "ppe_compliance": 0
  }
  ```
- **Response Format**:
  ```json
  {
    "incident_summary": "At a risk level of 90%, environmental factors breached critical limits: temperature reached 105C and gas level spiked to 95 ppm under active PPE compliance violation.",
    "root_cause_analysis": "The root cause analysis suggests mechanical overheating combined with pipeline leakages and safety compliance bypass.",
    "immediate_actions": [
      "Evacuate all personnel from the affected zone immediately.",
      "Shut down active power systems supplying the overheating equipment.",
      "Deploy gas scrubbers and sound the audible horn alarm."
    ],
    "preventive_actions": [
      "Inspect cooling lines and valves on the thermal machinery.",
      "Install automated safety gates utilizing computer vision for compliance checks."
    ],
    "recommended_sop": "Update SOP section 3.2: Immediate LOTO and zone lock down must occur within 30 seconds of concurrent gas (>85) and thermal (>100) warnings."
  }
  ```

### 3. SafetyGPT Chat Query
- **Endpoint**: `POST /api/v1/chat/query`
- **Description**: Returns detailed safety advice bounded strictly to the context of uploaded manuals.
- **Request Format**:
  ```json
  {
    "question": "What should be done if gas concentration exceeds 90 ppm?"
  }
  ```
- **Response Format**:
  ```json
  {
    "answer": "According to the safety manual guidelines: If gas level exceeds 90 ppm, execute evacuation procedures immediately. [osha_safety_guideline.pdf]",
    "sources": ["osha_safety_guideline.pdf"],
    "context_used": "Manual excerpt line 12: Gas exceeding 85 ppm indicates an active leak..."
  }
  ```

### 4. Upload Safety Document
- **Endpoint**: `POST /api/v1/chat/upload-document`
- **Description**: Ingests manual PDFs, splits them into logical characters, computes embeddings, and stores them in FAISS.
- **Request Format**: `multipart/form-data` containing file binary.
- **Response Format**:
  ```json
  {
    "filename": "guideline.pdf",
    "status": "Ingested and Indexed successfully",
    "chunks": 8
  }
  ```

---

## 🚀 Startup Instructions (Single-Command)

To run the entire platform (Backend, Frontend, and Sensor Simulator) concurrently with a single command on Windows (PowerShell):

1. Clone or verify the workspace is configured.
2. Ensure you have Node.js and Python 3.12 installed.
3. Open a PowerShell terminal in the root directory.
4. Set execution policy to run local scripts if necessary:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
5. Run the startup script:
   ```powershell
   .\start-platform.ps1
   ```
This script will automatically verify your python virtual environment, install missing Node dependencies, and launch three independent console windows running:
- **FastAPI backend API** (http://localhost:8000)
- **Vite React dashboard** (http://localhost:3000)
- **Interactive telemetry simulator**

---

## 📦 Deployment Guide

### 1. Environment Configurations
Rename `backend/.env.example` to `backend/.env` and update configuration variables:
```ini
APP_NAME="Industrial Safety Intelligence Platform API"
DEBUG=True
DATABASE_URL="sqlite:///./data/safety_platform.db"
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 2. Manual Local Setup (Step-by-Step)
If you prefer starting components manually:
- **Backend**:
  ```bash
  cd backend
  python -m venv venv
  # Activate venv:
  # On Windows: .\venv\Scripts\activate
  # On Linux/macOS: source venv/bin/activate
  pip install -r requirements.txt
  python main.py
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Simulator**:
  ```bash
  cd backend
  # Ensure venv is active
  python sensor_simulator.py
  ```

### 3. Production Deployment
- **Frontend Build**: Compile assets for distribution:
  ```bash
  cd frontend
  npm run build
  ```
  This creates compiled web files in `frontend/dist/` which can be hosted via Nginx, Apache, or static hosting providers.
- **Backend Server**: In production environments, run FastAPI behind an ASGI server like Uvicorn or Gunicorn with workers:
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
  ```
