# SmartCal SLM — self-hosted Ollama inference service (CPU).
# Deploy as a SEPARATE Railway service, kept private (internal networking only).
# The calendar service reaches it at http://<slm-service>.railway.internal:11434.
FROM ollama/ollama:latest

# Small instruct model that runs comfortably on CPU (8 vCPU / 8 GB) and is strong
# at structured JSON extraction. Override with SLM_MODEL if you want a different one
# (e.g. qwen2.5:1.5b-instruct for more speed).
ENV SLM_MODEL=qwen2.5:3b-instruct
# Ollama must listen on all interfaces to be reachable over Railway's network.
ENV OLLAMA_HOST=0.0.0.0:11434

COPY start-slm.sh /start-slm.sh
RUN chmod +x /start-slm.sh

EXPOSE 11434

# Override the base image's ENTRYPOINT (which is `ollama`) with our boot script.
ENTRYPOINT ["/start-slm.sh"]
