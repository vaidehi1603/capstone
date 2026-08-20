# AI-Driven Sustainability Framework for Smart Campus Carbon Intelligence
## Modern React + Vite Frontend

This is the official frontend web application for the **Smart Campus Carbon Intelligence Platform**. It connects directly to the FastAPI REST backend and PostgreSQL database to provide automated greenhouse gas (GHG) tracking, ISO 14064 accounting, departmental benchmarking, AI decarbonization recommendations, What-If policy simulation, and ML time-series carbon forecasting.

---

## 🛠 Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS (Tailored Emerald/Slate/Cyan Glassmorphic UI)
- **Routing**: React Router v7
- **HTTP Client**: Axios with JWT Bearer Interceptors & Centralized Error Handling
- **Data Visualizations**: Recharts (Donut, Multi-Bar, Area Trajectory, Confidence Bands)
- **Forms & Validation**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: Custom Floating Toast Notification System

---

## 📂 Project Structure

```
frontend/
├── public/
│   ├── logo.svg
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/         # StatCard, Modal, LoadingSpinner, Badge, EmptyState, etc.
│   │   ├── layout/         # AppLayout, Sidebar, Topbar, ProtectedRoute
│   │   ├── forms/          # ElectricityForm, DepartmentForm, EmissionFactorForm
│   │   ├── charts/         # ScopeDonutChart, DepartmentBarChart, MonthlyTrendChart, etc.
│   │   └── tables/         # DataTable (search, filter, pagination, export)
│   ├── pages/
│   │   ├── auth/           # LoginPage with OAuth2 flow & Evaluator presets
│   │   ├── dashboard/      # Executive Sustainability Dashboard
│   │   ├── data/           # Data Collection Hub & Dedicated Electricity Manager
│   │   ├── analytics/      # Multi-Scope Carbon Analytics Deep Dive
│   │   ├── departments/    # Campus Department Registry & Monitored Zones
│   │   ├── emission-factors/# Emission Factors Registry (CEA / IPCC Factors)
│   │   ├── predictions/    # AI Time-Series Forecasting & ML Projections
│   │   ├── recommendations/# Prescriptive AI Decarbonization Action Cards
│   │   ├── simulation/     # What-If Sustainability Policy Simulator
│   │   ├── reports/        # ESG Compliance & Carbon Audit Report Generator
│   │   └── settings/       # System Health Diagnostics & RBAC Matrix
│   ├── services/
│   │   ├── api.js          # Centralized Axios instance with Bearer interceptor
│   │   ├── authService.js  # Real OAuth2 login & session persistence
│   │   ├── departmentService.js     # Real GET & POST /api/v1/departments/
│   │   ├── electricityService.js    # Real GET & POST /api/v1/electricity/
│   │   ├── emissionFactorService.js # Real GET & POST /api/v1/emission-factors/
│   │   ├── analyticsService.js      # Real GET /api/v1/analytics/dashboard
│   │   ├── healthService.js         # Real GET /api/v1/health & /health/database
│   │   ├── activityService.js       # Water, Waste, Transport & Asset adapters
│   │   ├── predictionService.js     # ML forecasting service (Kaggle ready)
│   │   ├── recommendationService.js # AI recommendations service
│   │   ├── simulationService.js     # What-If carbon reduction scenario engine
│   │   └── reportService.js         # ESG audit reports and CSV exports
│   ├── context/
│   │   ├── AuthContext.jsx # RBAC state, session lifecycle, demo role switcher
│   │   └── ToastContext.jsx# Floating toast dispatcher
│   ├── hooks/              # useAuth, useToast
│   ├── routes/
│   │   └── AppRoutes.jsx   # Role-guarded route tree
│   ├── utils/              # formatters.js, constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Environment Configuration
Ensure `.env` exists in the `frontend/` directory (created automatically):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend will start at **`http://localhost:5173`**.

---

## 🔑 Authentication & Quick Evaluation Presets

The login page integrates with the backend OAuth2 form endpoint (`/api/v1/auth/login/access-token`).

For rapid project evaluation, 4 pre-configured login presets are available on the login screen:
1. **System Administrator** (`admin@example.com` / `admin123`) - Full access to create departments, register emission factors, log electricity, view analytics, and export reports.
2. **Maintenance / Facilities Lead** - Data entry for electricity, water, waste, and transport.
3. **Head of Department (HOD)** - Departmental emissions profile and recommendations.
4. **Sustainability Viewer** - Read-only dashboard analytics and trends.

---

## 🔗 Backend API Contract Mapping

| Frontend Page | Backend Endpoint | Method | Backend Action |
| :--- | :--- | :---: | :--- |
| **Topbar Health Pulse** | `/api/v1/health` | `GET` | Verifies FastAPI gateway status |
| **Topbar DB Pulse** | `/api/v1/health/database` | `GET` | Verifies PostgreSQL DB connectivity |
| **Login** | `/api/v1/auth/login/access-token` | `POST` | Issues JWT Bearer access token |
| **Dashboard KPIs & Charts** | `/api/v1/analytics/dashboard` | `GET` | Scope breakdown & department ranking |
| **Departments** | `/api/v1/departments/` | `GET` | Lists registered campus departments |
| **Add Department** | `/api/v1/departments/` | `POST` | Inserts new department (Admin) |
| **Electricity History** | `/api/v1/electricity/` | `GET` | Fetches activity records |
| **Record Electricity** | `/api/v1/electricity/` | `POST` | Synchronously computes Scope 2 carbon |
| **Emission Factors** | `/api/v1/emission-factors/` | `GET` | Fetches active carbon factors |
| **Add Emission Factor** | `/api/v1/emission-factors/` | `POST` | Registers new coefficient (Admin) |

---

## 🔒 Security Practices
- No PostgreSQL or backend secrets are exposed in the client.
- JWT Bearer tokens are attached dynamically via Axios interceptor.
- Automatic session termination and clean redirect upon 401 Unauthorized responses.
- Backend authorization (`RoleChecker`) remains the authoritative security boundary.
