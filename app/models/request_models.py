from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    user_goal: str = Field(description="User's description of the desired image")
    image_provider: str = Field(
        default="openai",
        description="Image generation provider: 'openai' | 'grok' | 'nano_banana'",
    )
    image_params: dict = Field(
        default_factory=dict,
        description="Provider-specific generation parameters (size, quality, style, etc.)",
    )
    max_iterations: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum number of optimization iterations",
    )


class UpdatePromptRequest(BaseModel):
    prompt_text: str = Field(description="Revised image prompt text provided by the user")


class FeedbackRequest(BaseModel):
    feedback_text: str = Field(description="User's feedback on the generated image")


class RunOptimizeRequest(BaseModel):
    max_iterations: int | None = Field(
        default=None,
        ge=1,
        le=10,
        description="Override the session's max_iterations for this run",
    )
