
# SFUMATO — AI Image Prompt Optimizer

## Project Overview

SFUMATO — сервис итеративной оптимизации промптов для генерации изображений.
Пользователь описывает желаемую картинку → сервис генерирует image prompt → показывает первое
изображение → запускает цикл оптимизации (по умолчанию 3 итерации): revise prompt → generate
image → judge quality. Результат: история всех изображений + финальный промпт + что сработало.

**Статус:** blueprint phase — код не написан. Начинать реализацию с `app/`.

---

## Architecture Summary

```
Flask (API + SPA) → api_controller.py → services/* → tools/*
                                                   → app/prompts/*.jinja2
```

Ключевые паттерны:
- Все текстовые LLM-вызовы через **OpenRouter** (модель Grok)
- Image providers через **provider_registry_tool.py** — dict dispatch, не if/elif
- Хранение: in-memory dict + `data/sessions/<uuid>/session.json` (no DB, no migrations)
- Изображения: `data/sessions/<uuid>/iter_<n>.<ext>`
- Промпты: **Jinja2** шаблоны в `app/prompts/` с FLEX-блоками

---

## Project Structure

```
app/
  main.py               # Flask app factory + run
  endpoints.py          # Route definitions (thin layer)
  api_controller.py     # Glue: endpoints → services

  models/
    request_models.py   # Pydantic: входящие request тела
    response_models.py  # Pydantic: API ответы
    domain_models.py    # Session, Iteration, ProviderCapabilities

  services/
    session_service.py        # Создание/загрузка сессий
    prompt_service.py         # generate_prompt, revise_prompt
    image_service.py          # generate(provider, prompt, params)
    judge_service.py          # evaluate(goal, prompt, image) → score+notes
    optimize_service.py       # Цикл: revise→generate→judge × N
    recommendation_service.py # build_summary(iterations) → что сработало

  tools/
    openrouter_tool.py         # Все текстовые LLM вызовы (Grok via OpenRouter)
    provider_registry_tool.py  # Registry: providers dict + capabilities dict
    openai_image_tool.py       # DALL-E 3
    grok_image_tool.py         # Grok Aurora
    nano_banana_image_tool.py  # Nano Banana
    storage_tool.py            # Чтение/запись session.json и изображений
    log_tool.py                # Настройка logger

  prompts/
    sys_cmd_prompt.jinja2        # Системный промпт для Grok
    llm_prompt_gen.jinja2        # Генерация стартового image prompt
    llm_prompt_revise.jinja2     # Правка prompt по feedback + judge notes
    llm_judge_prompt.jinja2      # Оценка изображения (score 0-100 + notes)
    providers/                   # Гайды по промптингу провайдеров
    templates/                   # Шаблоны payload-ов для LLM API

  utils/
    time_utils.py
    string_utils.py

  web/
    dist/                  # React build output (npm run build)
    templates/index.html

data/
  sessions/              # Runtime — в .gitignore

tests/
frontend/                # React + Vite + Tailwind source
```

---

## Key Commands

```bash
# Backend — запуск
poetry run flask --app app.main run --reload --port 5000
poetry run python -m app.main

# Тесты
./execute_tests.sh
poetry run pytest tests/ -v
poetry run pytest tests/test_endpoints.py -k "test_name" -v

# Форматирование и линт
make format       # ruff format
make lint         # ruff check
make check        # lint + type check
make fix          # auto-fix
make ruff-fix     # ruff --fix

# Frontend
cd frontend && npm run dev       # Dev сервер Vite
cd frontend && npm run build     # Сборка в app/web/dist

# Зависимости
poetry install
cd frontend && npm install
```

---

## Environment Variables

Файл: `.env` (создать по `.env.example`, **никогда не коммитить**)

```bash
OPENROUTER_API_KEY=sk-or-...          # Все текстовые LLM (Grok)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

OPENAI_IMAGE_API_KEY=sk-...           # DALL-E 3
GROK_API_KEY=xai-...                  # Grok Aurora image
NANO_BANANA_API_KEY=...               # Nano Banana

STORAGE_DIR=./data/sessions
MAX_ITERATIONS_DEFAULT=3
LOG_LEVEL=INFO
```

---

## Critical Paths

- **Optimize loop:** `app/services/optimize_service.py` → весь пайплайн
- **Provider dispatch:** `app/tools/provider_registry_tool.py` → `PROVIDERS[provider](...)`, `CAPABILITIES[provider]`
- **LLM вызовы:** `app/tools/openrouter_tool.py` → единственный клиент для всего текста
- **Image prompts:** `app/prompts/llm_prompt_revise.jinja2` — ключевой шаблон цикла с FLEX-блоками
- **Хранилище:** `data/sessions/<uuid>/` — создаётся через `storage_tool.py`, не вручную

---

## API Endpoints

| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/sessions` | Создать сессию → session_id + first_prompt |
| PUT | `/api/sessions/<id>/prompt` | Пользователь редактирует стартовый промпт |
| POST | `/api/sessions/<id>/generate` | Генерировать первое изображение (iter 0) |
| PUT | `/api/sessions/<id>/feedback` | Записать feedback пользователя |
| POST | `/api/sessions/<id>/optimize/run` | Запустить N итераций цикла |
| GET | `/api/sessions/<id>` | Состояние сессии + все итерации |

Статика: `GET /` → SPA, `GET /media/*` → изображения из `data/sessions/`

---

## Domain Models

```python
class Session(BaseModel):
    session_id: str          # UUID
    user_goal: str
    image_provider: str      # "openai" | "grok" | "nano_banana"
    image_params: dict       # provider-specific params
    iterations: list[Iteration]
    status: str              # "draft" | "running" | "done" | "failed"

class Iteration(BaseModel):
    index: int
    prompt_text: str
    prompt_diff: str | None  # Что изменилось от предыдущего
    image_path: str | None
    judge_score: int | None  # 0..100
    judge_notes: str | None
    user_feedback: str | None
```

---


## Task Workflow

When receiving a task, follow this strict 8-step process:

1. **Analyze** — Study the task. Analyze the codebase and estimate the required diff. Define acceptance criteria. If the task is large enough, break it into subtasks. Evaluate if this an Epic, Story, Task or Subtask.
2. **JIRA** — Check existing JIRA tasks. If matching tasks exist, use them (update if needed). If not, create tasks of the appropriate type via `scripts/jira_tool.py`. Each JIRA task must have: description, affected modules, acceptance criteria.
3. **Branch** — Create a git branch named `<JIRA-KEY>-<short-english-description>` (e.g. `ARCHIE-42-add-token-cost-calc`). If there is no JIRA task, use just a short English description. Switch to the branch before any code changes.
4. **Implement** — Implement according to plan and coding rules. Create necessary and sufficient unit and smoke tests (temporary or permanent).
5. **Review** — Review relevant modules post-implementation. Ensure no dead code was left behind.
6. **Test** — Run `./execute_tests.sh` and any task-specific temporary unit tests.
7. **Git** — If the task is done and meets acceptance criteria: `git add` changed/created modules one by one with a short commit message each. Then `git push` and open a PR via `gh pr create`.
8. **JIRA update** — Transition the JIRA task to `PR OPEN` (id `2`). Add a comment to the task with: any issues encountered during implementation, and a brief final report (what was done, what changed, key decisions made).

---

## Logging Convention

```python
logger.info(f"module_001: Description with \033[36m{id}\033[0m")    # Cyan — IDs, URLs
logger.info(f"module_002: Count: \033[33m{count}\033[0m")           # Yellow — numbers
logger.info(f"module_003: Name: \033[35m{name}\033[0m")             # Magenta — names
logger.error(f"module_error_001: \033[31m{error}\033[0m")           # Red — errors
```

---

## Code Style

### Python
- **Python 3.11+**, PEP8, type annotations on all function signatures
- `|` union syntax (`str | None`, not `Optional[str]`)
- **f-strings** for formatting; `"""` for docstrings, `"` for single-line strings
- `async/await` for all I/O; `asyncio.gather` for concurrent calls
- Run `make format` after writing code

### Pydantic Models
- `BaseModel` for all data structures with `Field(description=...)` on every field
- Access fields directly — don't guard with `hasattr` or `.get()`
- Use `model_dump()` / `model_validate()`, not deprecated `.dict()` / `.parse_obj()`

### Architecture Rules
- One responsibility per function/class
- No global state; use dependency injection or module-level singletons for clients
- Prefer dict dispatch over long `if/elif` chains
- No `print()` — use `logger` only
- No hardcoded values — use `config.py`, env vars, or constants
- No wildcard imports (`from x import *`)
- No code in `__init__.py`

### Import Order
```python
import os                          # 1. stdlib
from openai import OpenAI          # 2. third-party
from app.models.state_models import UserState  # 3. local
```

### Naming
- Functions: `get_`, `create_`, `update_`, `execute_`, `parse_` prefixes
- Modules: `*_tool.py`, `*_service.py`, `*_utils.py`, `*_client.py`
- No abbreviations in names

### What NOT to Do
- Don't use `print()` for logging
- Don't hardcode user-specific defaults (city, timezone, preferences) in source code
- Don't catch bare `except Exception` without logging the specific error
- Don't create new utility functions that duplicate existing ones — check `app/utils/` first
- Don't divide code with blank lines into visual "sections" inside functions
