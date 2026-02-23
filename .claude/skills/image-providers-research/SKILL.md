---
name: image-providers-research
description: Research current API docs for DALL-E 3, Grok Aurora, and Nano Banana image providers. Use when implementing or updating provider clients (openai_image_tool.py, grok_image_tool.py, nano_banana_image_tool.py), when checking supported parameters (sizes, quality, style), or when debugging provider API errors. Produces ProviderCapabilities reference for the registry.
tools: WebSearch, WebFetch, Read
---

# Image Providers Research

Research current API specifications for all three SFUMATO image providers and produce an
implementation reference for `app/tools/provider_registry_tool.py`.

## Before Starting

Read existing files if they already exist:
- `app/tools/provider_registry_tool.py` — check ProviderCapabilities schema
- `app/models/domain_models.py` — ProviderCapabilities field definitions
- `app/tools/openai_image_tool.py`, `grok_image_tool.py`, `nano_banana_image_tool.py`

## Step 1: DALL-E 3 (OpenAI Images API)

Search and fetch:
1. Search: `OpenAI DALL-E 3 API parameters images.generate 2025`
2. Fetch: `https://platform.openai.com/docs/api-reference/images/create`
3. Fetch: `https://platform.openai.com/docs/guides/images`

Capture:
- Endpoint: `POST https://api.openai.com/v1/images/generations`
- Auth: `Authorization: Bearer $OPENAI_IMAGE_API_KEY`
- Parameters: `model`, `prompt`, `n`, `size`, `quality`, `style`, `response_format`
- Supported `size` values (e.g. `1024x1024`, `1792x1024`, `1024x1792`)
- Supported `quality`: `standard` | `hd`
- Supported `style`: `vivid` | `natural`
- Max prompt length (characters)
- Response format: URL or base64 (`response_format`)
- Rate limits

## Step 2: Grok Aurora (xAI Image Generation)

Search and fetch:
1. Search: `xAI Grok Aurora image generation API 2025`
2. Search: `xAI API image generation endpoint parameters`
3. Fetch: `https://docs.x.ai/docs` (main xAI docs)
4. Search: `openrouter xai grok image model ID 2025`

Capture:
- Whether Grok uses OpenAI-compatible endpoint or custom format
- Endpoint URL and auth method (API key format: `xai-...`)
- Supported models (Aurora or other)
- Parameters: size, quality, style, seed support
- Response format
- Any unique features vs DALL-E 3

## Step 3: Nano Banana

Search and fetch:
1. Search: `Nano Banana image generation API documentation`
2. Search: `nano banana AI image API python endpoint`
3. Attempt to fetch their docs site if found

Capture:
- Endpoint URL and auth
- Required parameters
- Supported resolutions/sizes
- Unique features (style presets, etc.)
- Python client examples if available

## Step 4: OpenRouter — Grok Model IDs

1. Search: `OpenRouter xAI Grok models available 2025`
2. Fetch: `https://openrouter.ai/models?q=grok` or `https://openrouter.ai/x-ai`

Capture for each available Grok model:
- Full model ID string (e.g. `x-ai/grok-beta`)
- Supports image generation? (separate from text)
- Context window size
- Cost per 1M tokens (awareness only)

## Output Format

Produce a structured reference:

```
## DALL-E 3 (OpenAI)
Endpoint: POST https://api.openai.com/v1/images/generations
Auth: Authorization: Bearer $OPENAI_IMAGE_API_KEY

Parameters:
- model: "dall-e-3"
- prompt: str (max N chars)
- size: "1024x1024" | "1792x1024" | "1024x1792"
- quality: "standard" | "hd"
- style: "vivid" | "natural"
- response_format: "url" | "b64_json"

ProviderCapabilities:
- supported_aspect_ratios: ["1:1", "16:9", "9:16"]
- supports_seed: False
- supports_negative_prompt: False
- supports_style_presets: True

Python httpx async pattern:
[minimal async httpx.AsyncClient example for this provider]

---

## Grok Aurora (xAI)
[same structure]

---

## Nano Banana
[same structure]
```

## Notes for Implementation

- All provider clients must be `async` (use `httpx.AsyncClient`)
- Set explicit timeout: `httpx.Timeout(60.0)` for image generation calls
- After generating: save image binary to `data/sessions/<id>/iter_<n>.<ext>` via `storage_tool.save_image()`
- Return the local file path (str), not raw bytes
- Never log base64 image data or API key values
- On error: `logger.error(...)` with full exception, then raise `ImageGenerationError(provider, message)`
