# DALL-E 3 Prompting Guide

## Model Characteristics

DALL-E 3 is an autoregressive image generation model that processes prompts as natural language.
It performs best with descriptive, flowing prose rather than comma-separated keyword lists. The model
applies an internal prompt-revision step and returns the revised prompt in
`response.data[0].revised_prompt` — useful for debugging but should not be surfaced to users.

## API Constraints

- **No `negative_prompt` parameter.** Encode exclusions as prose: "an empty cobblestone street
  devoid of any people or vehicles."
- **n=1 only.** Cannot batch multiple generations in a single call.
- **Sizes:** `1024x1024`, `1792x1024` (landscape), `1024x1792` (portrait).
- **Quality:** `standard` (faster, cheaper) or `hd` (finer detail, better coherence on complex scenes).
- **Style:** `vivid` (saturated, dramatic) or `natural` (muted, photorealistic).
- **Prompt length:** Hard limit 4000 chars. Sweet spot: 150-400 chars.
- The model may refuse prompts depicting real people, violence, or adult content.

## Prompt Element Order

1. **Subject** — who/what, key attributes (count, appearance, action)
2. **Environment** — location, time of day, weather, era
3. **Lighting** — source, quality, color temperature, atmosphere
4. **Mood** — emotional tone, atmosphere adjectives
5. **Style** — artistic medium, movement, artist reference if appropriate
6. **Camera** — angle, focal length (descriptive language, not literal instructions)
7. **Composition** — framing, perspective, spatial relationships

## Proven Vocabulary

**Lighting:** cinematic lighting, golden hour, overcast diffuse, rim lighting, chiaroscuro,
volumetric rays, motivated lighting

**Style:** oil on canvas, watercolor wash, editorial photography, architectural render,
woodblock print, concept art, photorealism

**Camera/composition:** aerial perspective, worm's-eye view, tight portrait crop, extreme wide shot,
bokeh background, shallow depth of field

## Anti-Patterns

- **Keyword soup:** "beautiful amazing stunning gorgeous 4k ultra hd sharp" — ignored
- **Contradictory instructions:** "dark and bright lighting" — pick one
- **Overly long prompts:** DALL-E 3 compresses them internally, losing specific details
- **Negative prohibitions:** "not red, not blurry" → rephrase as positive ("vivid blue tones, sharp focus")
- **Multiple competing subjects:** limit to one primary subject with supporting elements

## Prompt Checklist

- [ ] Subject clearly identified with 2-3 key attributes
- [ ] Environment/setting specified
- [ ] Lighting direction or quality stated
- [ ] Style medium named explicitly
- [ ] Exclusions encoded as prose, not as "no X"
- [ ] Total length under 400 characters
- [ ] Size and quality set in API call (`quality=hd` for complex scenes)
