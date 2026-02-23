---
name: prompt-engineering-research
description: Research prompt engineering best practices for AI image generation and LLM-as-judge scoring patterns. Use when writing or improving Jinja2 prompt templates in app/prompts/, when implementing the optimize loop, when judge scores cluster too narrowly, or when prompt revision fails to improve results across iterations.
tools: WebSearch, WebFetch, Read
---

# Prompt Engineering Research

Research current best practices for image generation prompts and LLM-as-judge patterns
used in SFUMATO's optimize loop.

## Context

SFUMATO uses four Jinja2 templates in `app/prompts/`:
- `llm_prompt_gen.jinja2` — generates initial image prompt from user goal
- `llm_prompt_revise.jinja2` — revises prompt based on user_feedback + judge_notes
- `llm_judge_prompt.jinja2` — evaluates image quality → `{score: int, notes: str, ...}`
- `sys_cmd_prompt.jinja2` — system instructions for Grok

Image prompts use **FLEX blocks** to mark editable sections:
`## FLEX_BEGIN:<name>` ... `## FLEX_END:<name>`

Named FLEX blocks: `subject`, `style`, `composition`, `lighting`, `camera`, `constraints`

Read existing templates first (if they exist):
- `app/prompts/llm_prompt_gen.jinja2`
- `app/prompts/llm_prompt_revise.jinja2`
- `app/prompts/llm_judge_prompt.jinja2`

## Step 1: Image Prompt Structure — DALL-E 3

1. Search: `DALL-E 3 prompt engineering guide best practices 2025`
2. Search: `OpenAI DALL-E 3 prompt structure composition lighting vocabulary`
3. Fetch OpenAI prompting guide if found

Capture:
- Recommended prompt element order (subject first? style last?)
- Lighting vocabulary that works (volumetric, golden hour, rim light, etc.)
- Style/artistic direction terms (photorealistic, cinematic, painterly, etc.)
- Camera/perspective terms (35mm lens, wide angle, macro, etc.)
- Composition terms (rule of thirds, dutch angle, bokeh, etc.)
- Negative prompt workarounds (DALL-E 3 doesn't natively support negative_prompt)
- Max effective prompt length before truncation hurts quality
- What breaks DALL-E 3 prompts (contradictions, overloading, policy triggers)

## Step 2: Image Prompt Structure — Grok Aurora

1. Search: `xAI Grok Aurora image generation prompt guide 2025`
2. Search: `Grok image prompting vocabulary style keywords`

Capture:
- Vocabulary or tags Aurora responds to differently than DALL-E 3
- Whether Aurora supports native negative_prompt parameter
- Style preset vocabulary unique to Aurora
- Any known quirks vs DALL-E 3

## Step 3: LLM-as-Judge Patterns

1. Search: `LLM as judge image quality evaluation prompt 2025`
2. Search: `GPT-4V image evaluation scoring rubric JSON output`
3. Search: `image judge score calibration 0 100 prompt template`

Capture:
- Rubric dimensions for image quality (composition, prompt adherence, technical quality, aesthetics)
- Output format that produces clean scores (JSON schema vs markdown)
- Prompt patterns that yield calibrated 0-100 scores (not clustered in 70-90)
- Chain-of-thought reasoning patterns for judge
- How to prevent judge from always scoring 80-90
- Whether Grok vision (judge model) needs special framing vs GPT-4V

## Step 4: Prompt Revision Strategies

1. Search: `iterative prompt revision LLM feedback loop image generation 2025`
2. Search: `prompt optimization image generation technique diff-aware revision`

Capture:
- How to instruct LLM to change only failing aspects, not the whole prompt
- How to combine `user_feedback` + `judge_notes` + `previous_prompt` in one revision call
- Strategies for FLEX-block revision: modify only the blocks that address the feedback
- How many feedback tokens is effective vs noise
- Prompt patterns that produce structured diffs (what changed and why)

## Output Format

### Document 1: Jinja2 Template Skeletons

For each template, provide the recommended structure:

```jinja2
{# llm_prompt_gen.jinja2 #}
{# Variables: user_goal, image_provider, aspect_ratio, style_hint #}
[recommended structure here]
```

```jinja2
{# llm_prompt_revise.jinja2 #}
{# Variables: previous_prompt, user_feedback, judge_notes, judge_score, provider_capabilities #}
[recommended structure — must preserve FLEX block markers in output]
```

```jinja2
{# llm_judge_prompt.jinja2 #}
{# Variables: user_goal, image_prompt, image_data (base64 or URL) #}
[rubric + output schema specification]
{# Output must be JSON: {"score": int, "notes": str, "strong_points": list, "weak_points": list} #}
```

### Document 2: Provider Guides Content

Draft content (~300-400 words each) for:

**`app/prompts/providers/openai_prompting_guide.md`:**
- DALL-E 3 limitations and quirks
- Proven vocabulary (lighting, style, camera, composition terms)
- Anti-patterns (what to avoid)
- Prompt review checklist

**`app/prompts/providers/grok_prompting_guide.md`:**
- Aurora-specific vocabulary and features
- Differences from DALL-E 3 approach
- Anti-patterns
- Prompt review checklist

## Notes

- Judge model must have vision capability — see `/openrouter-research` for correct model ID
- FLEX block revision: instruct Grok to output the **full revised prompt** with FLEX markers preserved
- Judge JSON output must be parseable: use `json.loads()` on the response
- Recommended judge output schema: `{"score": int, "notes": str, "strong_points": list[str], "weak_points": list[str]}`
- System prompt (`sys_cmd_prompt.jinja2`) sets Grok's role and output format expectations for each call type
