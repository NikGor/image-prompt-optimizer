# Grok Aurora Prompting Guide

## Model Characteristics

Grok Aurora is a flow-matching generative image model. It responds well to keyword-dense,
comma-separated prompt structures and handles technical photography terminology naturally.
Unlike DALL-E 3, Aurora accepts a native `negative_prompt` parameter — always use it.

## API Constraints

- **Native `negative_prompt` support.** Use it — it is effective and should always be included.
- **Model ID:** `grok-2-image`
- **Endpoint:** `https://api.x.ai/v1` (OpenAI-compatible SDK interface)
- **n:** 1 to 10 images per call.
- **No size/quality/style parameters** — all visual qualities must be encoded in the prompt text.
- Practical sweet spot: 100-300 words.

## Standard Negative Boilerplate

Always include as the base for `negative_prompt`:

```
blurry, low quality, watermark, text, signature, deformed, bad anatomy, extra limbs,
missing limbs, fused fingers, worst quality, jpeg artifacts, noise, grainy,
oversaturated, flat lighting
```

Append goal-specific exclusions: e.g., for a portrait, add "multiple faces, crowd."

## Prompt Structure

```
[Subject with attributes], [environment], [lighting descriptor], [mood],
[style/medium], [camera details], [quality boosters]
```

Example: `lone astronaut sitting on a cracked lunar surface, distant Earth in background,
dramatic rim lighting from behind, melancholy and isolated, photorealistic NASA photography
style, wide-angle 24mm lens, 8k resolution, sharp focus`

## Vocabulary Differences from DALL-E 3

| Aspect          | DALL-E 3           | Grok Aurora                   |
|-----------------|--------------------|-------------------------------|
| Format          | Flowing prose      | Comma-separated keywords      |
| Negatives       | Encode in prose    | Use `negative_prompt` param   |
| Quality boosts  | Mostly ignored     | Effective: "8k, sharp focus"  |
| Camera terms    | Descriptive only   | Interpreted more literally    |

## Quality Boosters That Work

Append to end of prompt: `sharp focus, 8k resolution, professional photography,
highly detailed, cinematic quality`

## Anti-Patterns

- **Long prose paragraphs:** Aurora prefers keywords over narrative sentences
- **Missing negative_prompt:** without it, the model may produce artifacts or anatomy errors
- **Contradictory style terms:** "photorealistic impressionist oil painting" — choose a lane
- **Vague quality terms:** "nice, good, pretty" — use specific technical descriptors

## Prompt Checklist

- [ ] Main subject described with 3-5 keyword attributes
- [ ] Environment/setting included as keywords
- [ ] Lighting direction and quality specified
- [ ] Style/medium named
- [ ] `negative_prompt` populated with boilerplate + goal-specific exclusions
- [ ] Quality boosters appended at end of main prompt
- [ ] n parameter set (default 1)
