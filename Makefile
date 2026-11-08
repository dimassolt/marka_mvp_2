.PHONY: start dev

# Install dependencies if missing or out of date, then start both.
start: engine/.venv engine/models/gliner_multi-v2.1/onnx/model_fp16.onnx engine/models/gemma-4-E2B-it-GGUF/gemma-4-E2B-it-Q4_K_M.gguf extension/node_modules dev

# Start the engine and the extension together. Ctrl+C stops both.
dev:
	@trap 'kill 0' INT; \
	(cd engine && uv run ghost-engine) & \
	(cd extension && npm run dev) & \
	wait

# Re-run only when the lockfile is newer than the last install.
engine/.venv: engine/uv.lock
	cd engine && uv sync
	@touch $@

# The GLiNER model (about 600 MB), downloaded once. See scripts/install.sh for a full setup.
engine/models/gliner_multi-v2.1/onnx/model_fp16.onnx:
	cd engine && uv run python scripts/fetch_gliner.py

# The rephrase model, Gemma 4 E2B (about 3.1 GB), downloaded once.
engine/models/gemma-4-E2B-it-GGUF/gemma-4-E2B-it-Q4_K_M.gguf:
	cd engine && uv run python scripts/fetch_rephrase_model.py

extension/node_modules: extension/package-lock.json
	cd extension && npm install
	@touch $@
