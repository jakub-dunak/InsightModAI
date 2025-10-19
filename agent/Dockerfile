# Multi-stage Dockerfile for InsightModAI Agent
# Optimized for AWS Lambda and AgentCore Runtime deployment

# Build stage
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Copy Python dependencies
COPY pyproject.toml uv.lock* ./

# Install Python dependencies using uv
RUN uv sync --frozen --no-cache

# Runtime stage
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed dependencies from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy agent source code
COPY insights_agent.py .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"

# Expose port for AgentCore Runtime
EXPOSE 8080

# Health check for AgentCore Runtime
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/ping', timeout=5).raise_for_status()" || exit 1

# Run the AgentCore Runtime
CMD ["python", "insights_agent.py"]
