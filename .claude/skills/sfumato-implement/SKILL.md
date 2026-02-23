---
name: sfumato-implement
description: Guided implementation workflow for SFUMATO modules. Use when starting to implement any module (service, tool, endpoint, model, Jinja2 template), when unsure about dependency order, or when you want to verify architecture compliance before writing code. Encodes project-specific patterns and common mistakes to avoid.
tools: Read, Glob, Grep, Bash
---

# SFUMATO Implementation Guide

Systematic implementation workflow enforcing architecture rules from CLAUDE.md.

## Before Writing Any Code

Check what already exists:
```bash
ls app/services/ app/tools/ app/models/ app/prompts/ 2>/dev/null || echo "Not created yet"
```

Read relevant existing modules before writing a new one:
- `app/tools/provider_registry_tool.py` — registry pattern reference
- `app/models/domain_models.py` — Session, Iteration, ProviderCapabilities fields
- `app/tools/openrouter_tool.py` — async httpx client pattern
- `app/tools/storage_tool.py` — how to read/write files

---

## Implementation Order

Respect dependencies — each phase depends on the previous.

**Phase 1 — Models (no dependencies):**
1. `app/models/domain_models.py` — Session, Iteration, ProviderCapabilities
2. `app/models/request_models.py` — CreateSessionRequest, FeedbackRequest, etc.
3. `app/models/response_models.py` — SessionResponse, IterationResponse, etc.
4. `app/tools/log_tool.py` — logger setup (used everywhere)
5. `config.py` — all env vars with defaults via `os.environ.get()`

**Phase 2 — Infrastructure Tools:**
6. `app/tools/storage_tool.py` — save/load session.json, save image bytes
7. `app/tools/openrouter_tool.py` — async text + vision LLM calls (Grok via OpenRouter)
8. `app/tools/openai_image_tool.py` — DALL-E 3 generate_image()
9. `app/tools/grok_image_tool.py` — Grok Aurora generate_image()
10. `app/tools/nano_banana_image_tool.py` — Nano Banana generate_image()
11. `app/tools/provider_registry_tool.py` — `PROVIDERS` dict + `CAPABILITIES` dict

**Phase 3 — Jinja2 Prompts:**
12. `app/prompts/sys_cmd_prompt.jinja2` — system role instructions for Grok
13. `app/prompts/llm_prompt_gen.jinja2` — generate initial image prompt
14. `app/prompts/llm_prompt_revise.jinja2` — revise prompt (FLEX blocks preserved)
15. `app/prompts/llm_judge_prompt.jinja2` — evaluate image → JSON score

**Phase 4 — Services:**
16. `app/services/session_service.py` — create/load sessions
17. `app/services/prompt_service.py` — generate_prompt, revise_prompt
18. `app/services/image_service.py` — generate(provider, prompt, params, session_id, iter)
19. `app/services/judge_service.py` — evaluate(goal, prompt, image_path) → score+notes
20. `app/services/optimize_service.py` — full loop: revise→generate→judge × N
21. `app/services/recommendation_service.py` — build_summary(iterations)

**Phase 5 — API Layer:**
22. `app/endpoints.py` — route definitions (thin)
23. `app/api_controller.py` — glue: parse request → call service → return response
24. `app/main.py` — Flask app factory + static file serving + run

**Phase 6 — Tests:**
25. `tests/test_provider_registry.py`
26. `tests/test_endpoints.py`
27. `tests/test_optimize_flow.py`

---

## Architecture Checklist

Verify before writing each module:

### Provider Clients (openai_image_tool.py, etc.)
- [ ] Async: `async def generate_image(...) -> str`
- [ ] `httpx.AsyncClient` with `timeout=httpx.Timeout(60.0)`
- [ ] Auth from env var, never hardcoded
- [ ] Returns local file path (str), not raw bytes
- [ ] Image saved via `storage_tool.save_image()`
- [ ] Error: log exception with ANSI codes, then raise structured exception
- [ ] Never log base64 data or API keys

### provider_registry_tool.py
- [ ] `PROVIDERS: dict[str, Callable]` — module-level, no class
- [ ] `CAPABILITIES: dict[str, ProviderCapabilities]` — module-level
- [ ] Zero if/elif chains — pure `PROVIDERS[provider](...)` dispatch
- [ ] All three providers registered at module initialization

### Services
- [ ] All service functions are `async`
- [ ] Use `await asyncio.gather(...)` for independent parallel calls
- [ ] No global state accessed inside functions — dependencies via arguments
- [ ] One responsibility per function
- [ ] Pydantic models for all structured data (not raw dicts)
- [ ] `model_validate()` for input, `model_dump()` for output

### Jinja2 Templates
- [ ] Variables documented at top as Jinja2 comment: `{# Variables: x, y, z #}`
- [ ] FLEX blocks use exact markers: `## FLEX_BEGIN:<name>` and `## FLEX_END:<name>`
- [ ] `llm_judge_prompt.jinja2` specifies JSON output schema explicitly in the prompt
- [ ] `sys_cmd_prompt.jinja2` is used as system message, not user message

### Endpoints / api_controller.py
- [ ] Endpoints are thin: parse → call controller → return
- [ ] Pydantic for request parsing: `RequestModel.model_validate(request.get_json())`
- [ ] Pydantic for response: `response_obj.model_dump()`
- [ ] 400 for validation errors, 500 for internal errors with structured error body

---

## Module Templates

### Service Function
```python
import asyncio
import logging
from app.models.domain_models import Session, Iteration

logger = logging.getLogger(__name__)

async def revise_prompt(
    session: Session,
    previous_prompt: str,
    user_feedback: str | None,
    judge_notes: str | None,
) -> tuple[str, str]:
    """Revise image prompt. Returns (new_prompt, diff_summary)."""
    logger.info(
        f"prompt_service_001: Revising prompt for session \033[36m{session.session_id}\033[0m"
    )
    # implementation
```

### Tool Function (image provider)
```python
import logging
import httpx
from app.tools.storage_tool import save_image

logger = logging.getLogger(__name__)

ENDPOINT = "https://api.openai.com/v1/images/generations"

async def generate_image(
    prompt: str,
    params: dict,
    session_id: str,
    iteration_index: int,
    api_key: str,
) -> str:
    """Generate image via DALL-E 3. Returns local image path."""
    logger.info(
        f"openai_image_tool_001: Generating for session \033[36m{session_id}\033[0m"
        f" iter \033[33m{iteration_index}\033[0m"
    )
    async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
        response = await client.post(
            ENDPOINT,
            headers={"Authorization": f"Bearer {api_key}"},
            json={"model": "dall-e-3", "prompt": prompt, **params},
        )
        response.raise_for_status()
        # parse, save, return path
```

---

## Common Mistakes — Top 10

| Wrong | Correct |
|-------|---------|
| `if provider == "openai": ...` | `PROVIDERS[provider](...)` |
| `print(...)` | `logger.info(f"module_001: ...")` |
| `Optional[str]` | `str \| None` |
| `obj.dict()` | `obj.model_dump()` |
| `Model.parse_obj(d)` | `Model.model_validate(d)` |
| `except Exception: pass` | `except Exception as e: logger.error(...); raise` |
| Hardcoded API key | `os.environ.get("KEY")` or `config.KEY` |
| `from app.tools import *` | Explicit imports only |
| Code in `__init__.py` | Keep `__init__.py` empty |
| `os.makedirs("data/sessions/...")` in service | Use `storage_tool.ensure_session_dir()` |

---

## After Each Module

```bash
make format
make lint
./execute_tests.sh
```

If `make format` is set in hooks, it runs automatically after Edit/Write.
Still run `make lint` manually to catch type and style issues.

---

## Research Skills Available

Before implementing provider clients or prompt templates, run the relevant research skill:
- `/image-providers-research` — DALL-E 3, Grok Aurora, Nano Banana API specs
- `/openrouter-research` — OpenRouter API, Grok model IDs, vision capability
- `/prompt-engineering-research` — Jinja2 template structures, LLM-as-judge patterns
