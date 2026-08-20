from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, auth, dashboard, ai_insights, simulation, upload, departments, electricity, emission_factors, analytics

app = FastAPI(
    title="AI-Driven Sustainability Framework API",
    description="Backend for Smart Campus Carbon Intelligence",
    version="2.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS] if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(electricity.router, prefix="/api/v1/electricity", tags=["Electricity"])
app.include_router(emission_factors.router, prefix="/api/v1/emission-factors", tags=["Emission Factors"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(ai_insights.router, prefix="/api/v1/insights", tags=["AI & ML Insights"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Simulation"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["Data Hub Upload"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Driven Sustainability Framework API! Visit /docs for the Swagger UI."}
