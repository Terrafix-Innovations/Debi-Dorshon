# Use official slim Python base image
FROM python:3.11-slim

# Copy uv binary from official Astral image for high-speed package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_COMPILE_BYTECODE=1

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY pyproject.toml uv.lock ./

# Install dependencies using uv into system environment
RUN uv pip install --system -r pyproject.toml

# Copy application source code and dataset
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Entrypoint: Start Uvicorn server with multi-workers and dynamic PORT for Render / Cloud deployment
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${WEB_CONCURRENCY:-2}"]
