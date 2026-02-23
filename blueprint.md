SFUMATO

### 1) Цель и ключевая идея

"Лучшатель" промпта для генерации изображений. Сервис перебирает варианты промпта, генерирует картинки и оценивает результат через LLM-judge, пока качество не станет лучше (или пока не закончатся итерации).

Пайплайн:

1. Юзер пишет, что хочет, выбирает image provider и параметры (aspect ratio, размер и тд).
2. Бэкенд формирует стартовый image prompt и показывает его в редактируемом поле (UI).
3. Генерируется первая картинка.
4. Юзер пишет, что не нравится (feedback) или принимает.
5. Запускается цикл итераций (по умолчанию 3): revise prompt -> generate image -> judge -> сохранить результат.
6. Вывод: все картинки от первой до финальной + финальный промпт + история изменений + краткие рекомендации "что сработало".

---

### 2) Технологии и библиотеки

#### Backend (Flask)

* **Flask** - API + отдача SPA (React build)
* **Flask-Cors** - только для dev (если фронт отдельно)
* **pydantic** - валидация request/response
* **httpx** - вызовы OpenRouter и image providers
* **python-dotenv** - локальные env
* **logging** - структурные логи (желательно json formatter)
* **pytest** - тесты
* **ruff** + **black** - линт/формат
* **Pillow** (опционально) - если нужно работать с превью/размерами/форматами

Управление зависимостями - через Poetry

#### Frontend (React)

* React + Vite
* UI: **Tailwind CSS** (темная тема)
* Build: `npm run build` -> артефакты в `app/web/dist`

#### Интеграции

* **OpenRouter** для текстовых LLM (все текстовые вызовы через Grok)

  * prompt-gen: **Grok**
  * prompt-revise: **Grok**
  * judge: **Grok**
* Image providers (выбор юзером): **OpenAI / Grok / Nano Banana**

---

### 3) Ограничения и принципы

* Без БД и без миграций (никакого Alembic).
* Организация по ответственности: endpoints -> services -> tools -> models.
* Минимализм: без лишних абстракций.
* Без if-elif цепочек для провайдеров: registry dict (provider_name -> client).
* DRY без фанатизма.

---

### 4) Структура проекта

```text
project/
  pyproject.toml
  README.md
  .env.example

  app/
    main.py
    endpoints.py
    api_controller.py

    models/
      request_models.py
      response_models.py
      domain_models.py

    services/
      session_service.py
      prompt_service.py
      image_service.py
      judge_service.py
      optimize_service.py
      recommendation_service.py

    tools/
      openrouter_tool.py
      provider_registry_tool.py
      openai_image_tool.py
      grok_image_tool.py
      nano_banana_image_tool.py
      storage_tool.py
      log_tool.py

    prompts/
      sys_cmd_prompt.jinja2
      llm_judge_prompt.jinja2
      llm_prompt_gen.jinja2
      llm_prompt_revise.jinja2

      providers/
        openai_prompting_guide.md
        gemini_prompting_guide.md
        grok_prompting_guide.md

      templates/
        openai_text_llm.jinja2
        gemini_text_llm.jinja2
        grok_text_llm.jinja2

    utils/
      time_utils.py
      string_utils.py

    web/
      dist/                # React build
      templates/
        index.html         # SPA entry

  data/
    sessions/             # файлы сессий и изображения (MVP)

  tests/
    test_endpoints.py
    test_optimize_flow.py
    test_provider_registry.py
```
+
makefile,
gitignore,
poetry


Роли:

* `main.py` - только создание app и запуск.
* `endpoints.py` - маршруты (тонко).
* `api_controller.py` - glue endpoints -> services.
* `services/*` - бизнес-логика пайплайна.
* `tools/*` - интеграции (OpenRouter, image providers, storage) + логирование.
* `prompts/*` - все шаблоны промптов и гайды.

---

### 5) Данные и доменная модель (без БД)

#### Session

* `session_id`
* `user_goal`
* `image_provider`
* `image_params` (нормализованные)
* `iterations` (список)
* `status` (draft/running/done/failed)

#### Iteration

* `index`
* `prompt_text`
* `prompt_diff` (кратко что поменяли)
* `image_path` или `image_url`
* `judge_score` (0..100)
* `judge_notes` (коротко)
* `user_feedback` (если есть)

Хранение состояния:

* MVP: in-memory dict + запись минимального json-файла в `data/sessions/<id>/session.json` (опционально).
* Изображения: `data/sessions/<id>/iter_<n>.<ext>`.

---

### 6) Capabilities для image providers

У каждого image provider свои параметры. Чтобы не плодить if-ы:

* `provider_registry_tool.py` хранит:

  * `providers: dict[str, ImageProviderClient]`
  * `capabilities: dict[str, ProviderCapabilities]`
* Фронт получает `capabilities` для выбранного провайдера и показывает только доступные настройки.

`ProviderCapabilities` (пример):

* `supported_aspect_ratios`
* `supported_sizes` или `max_resolution`
* `supports_seed`
* `supports_negative_prompt`
* `supports_style_presets`

---

### 7) API (минимальный набор)

* `POST /api/sessions`

  * вход: goal, provider, image_params, iterations_count (default 3)
  * выход: session_id + first_prompt_text

* `PUT /api/sessions/<id>/prompt`

  * юзер редактирует стартовый промпт

* `POST /api/sessions/<id>/generate`

  * генерит картинку для текущего prompt, создает iteration[0]

* `PUT /api/sessions/<id>/feedback`

  * юзер пишет feedback

* `POST /api/sessions/<id>/optimize/run`

  * запускает цикл N итераций: revise -> generate -> judge
  * выход: session summary (iterations + recommendations)

* `GET /api/sessions/<id>`

  * получить состояние и все итерации

Статика SPA:

* `GET /` -> index.html
* `GET /assets/*` -> React build assets
* `GET /media/*` -> изображения

---

### 8) Optimize loop (все текстовые LLM - Grok)

`optimize_service.run(session_id, iterations_count)`:

1. Берет last iteration + user_feedback.
2. `prompt_service.revise_prompt(...)` через `openrouter_tool` (Grok):

   * вход: goal, previous_prompt, user_feedback, judge_notes, provider_capabilities
   * выход: new_prompt + краткий diff
3. `image_service.generate(provider, prompt, params)`.
4. `judge_service.evaluate(goal, prompt, image)` через `openrouter_tool` (Grok):

   * выход: score + notes (короткие причины)
5. Сохраняет итерацию (даже если хуже - важна трассировка).
6. `recommendation_service.build_summary(iterations)` - 3-7 пунктов "что сработало".

---

### 9) Prompts: шаблоны, гайды и "гибкие части"

#### Jinja2 промпты на каждый LLM-вызов

Папка: `app/prompts/`

* `sys_cmd_prompt.jinja2` - системные правила для Grok (тон: коротко, структурировано)
* `llm_prompt_gen.jinja2` - генерация стартового image prompt
* `llm_prompt_revise.jinja2` - правка image prompt на основе feedback + judge notes
* `llm_judge_prompt.jinja2` - оценка картинки (score + reasons)

#### Гайды по промптингу (как документация)

Папка: `app/prompts/providers/`

* `openai_prompting_guide.md`
* `gemini_prompting_guide.md`
* `grok_prompting_guide.md`

Подготовь базовые на полстраницы каждый с учетом требований каждого провайдера

Содержимое гайдов:

* ограничения/особенности провайдера
* структура промптов
* что обычно ломает результат
* чеклист для композиции/света/стиля/ограничений

#### Шаблоны payload-ов (документация + будущая совместимость)

Папка: `app/prompts/templates/`

* `openai_text_llm.jinja2`
* `gemini_text_llm.jinja2`
* `grok_text_llm.jinja2`

#### Как отмечать гибкие части промпта

Чтобы optimize loop менял только нужное, в image prompt используем явную разметку:

* блоки `## FLEX_BEGIN:<name>` ... `## FLEX_END:<name>`
* и/или плейсхолдеры `{{ flex.<name> }}`

Рекомендуемые FLEX-блоки:

* `subject`
* `style`
* `composition`
* `lighting`
* `camera`
* `constraints`
* `negative_constraints`

Правило: сервис изменяет только FLEX-блоки, каркас остается стабильным.

---

### 10) Хранилище и конфиги

#### Хранилище (без БД)

MVP:

* изображения на диск: `data/sessions/<id>/iter_<n>.<ext>`
* состояние: in-memory (опционально - `session.json` рядом)

#### ENV

* `OPENROUTER_API_KEY`
* `OPENROUTER_BASE_URL`
* `OPENAI_IMAGE_API_KEY` / `GROK_API_KEY` / `NANO_BANANA_API_KEY`
* `STORAGE_DIR=./data/sessions`
* `MAX_ITERATIONS_DEFAULT=3`
* `LOG_LEVEL=INFO`

---

### 11) Надежность и безопасность (без tenacity)

* явные timeouts на внешние запросы
* единый формат ошибок API (code/message/details)
* лимиты: max iterations, max payload
* не логировать секреты и base64 изображений

---

### 12) UI

* React SPA
* Tailwind CSS
* темная тема

### 13) UX

Шаблон проекта с UX дизайном описан в приложенном файле ux_draft.jsx

### 14) Логотипы

Располагаются в `assets/`:

* `assets/logo_horizontal.png` — горизонтальный логотип (иконка + надпись SFUMATO), используется в шапке/навбаре
* `assets/logo_icon.png` — иконка без надписи, используется как favicon и пульсирующий лоадер ожидания
* `assets/star.png` — звезда-вспышка, декоративный элемент UI