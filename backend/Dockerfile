# SkillBytes Backend — Production Dockerfile
# Deployed on Render (or any container platform)
# MongoDB connection is injected via MONGODB_URI environment variable at runtime

FROM python:3.11-slim-bullseye

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Runtime environment variables
# NOTE: Do NOT hardcode MONGODB_URI here.
#       Set it as a secret environment variable in Render/Railway/Fly.io dashboard.
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Expose API port
EXPOSE 8000

# Health check — uses curl (installed above) to verify the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the FastAPI server
# On Render, $PORT is injected automatically; fallback to 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
