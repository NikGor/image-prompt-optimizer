# Nano Banana Prompting Guide

## Status

Nano Banana integration is currently a placeholder. The API endpoint, authentication method,
and available parameters are not yet finalized. This guide will be updated once the integration
is confirmed.

## What Is Known

- Nano Banana is planned as the third image provider option in SFUMATO
- The `nano_banana_image_tool.py` module will implement the provider interface once API details
  are available
- Provider capabilities will be registered in `provider_registry_tool.py` under key `"nano_banana"`

## General Best Practices (Apply Until Provider-Specific Guidance Available)

While the Nano Banana specifics are TBD, these universal principles apply:

- **Describe, don't instruct:** "a red barn in a snowy field at dusk" outperforms
  "generate a barn image with snow and a sunset"
- **Layer specificity:** Subject → Environment → Lighting → Style
- **Use concrete visual language:** dimensions, colors, textures, materials
- **Include negative constraints** if the API supports them; otherwise rephrase as positive

## Placeholder API Parameter Assumptions

Until confirmed, SFUMATO treats Nano Banana as supporting:
- `prompt` (string, required)
- `negative_prompt` (string, optional — to be confirmed)
- `n` (integer, default 1 — to be confirmed)

## Placeholder Checklist

- [ ] Confirm API endpoint and auth method with Nano Banana documentation
- [ ] Confirm supported parameters (size, quality, negative_prompt, seed)
- [ ] Update `nano_banana_image_tool.py` with real request structure
- [ ] Update `ProviderCapabilities` in `provider_registry_tool.py`
- [ ] Replace this guide with provider-specific research findings
