#!/bin/sh
# Boot Ollama, then pull the model so the first real request is fast.
set -e

MODEL="${SLM_MODEL:-qwen2.5:3b-instruct}"
echo ">>> [slm] starting ollama serve | model=${MODEL} | host=${OLLAMA_HOST:-<unset>}"

# Start the server in the background.
ollama serve &
SERVE_PID=$!

# Wait until the server answers before pulling.
echo ">>> [slm] waiting for ollama to come up ..."
until ollama list >/dev/null 2>&1; do
  sleep 1
done

echo ">>> [slm] pulling model ${MODEL} (first boot may take a few minutes) ..."
ollama pull "${MODEL}" || echo ">>> [slm] WARNING: model pull failed; will retry on demand"
echo ">>> [slm] model ready. serving on ${OLLAMA_HOST:-0.0.0.0:11434}"

# Keep the container alive on the serve process.
wait "${SERVE_PID}"
