# SmartCal SLM service (Ollama)

Self-hosted small language model that extracts assignments from text. Runs on CPU.

## Deploy on Railway (separate service)

1. In your Railway project, **New Service → GitHub repo** → pick `PersonalWebsite`.
2. Set the service **Root Directory** to `calendar/slm` (so it uses this folder's `Dockerfile`).
3. Attach a **Volume** mounted at `/root/.ollama` (≈4 GB) so the pulled model
   survives redeploys instead of re-downloading each time.
4. Do **not** add a public domain — keep it private. The calendar service talks to
   it over the private network.
5. (Optional) Env var `SLM_MODEL` to change the model, e.g. `qwen2.5:1.5b-instruct`
   for more speed, `qwen2.5:3b-instruct` (default) for better accuracy.

## Wiring it to the calendar service

On the **calendar** service set:

```
SLM_BASE_URL = http://<this-service-name>.railway.internal:11434
SLM_MODEL    = qwen2.5:3b-instruct   # must match what this service pulls
```

Find the internal hostname on the SLM service's **Settings → Networking → Private
Networking** (e.g. `slm.railway.internal`).

## Notes

- First boot pulls the model (~2 GB for 3B q4); with the volume it's cached after that.
- The model is prompted for strict JSON — see `../server/slm.js`.
- CPU inference on 8 vCPU / 8 GB handles the 3B model fine for short extraction prompts.
