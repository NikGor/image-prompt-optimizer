from typing import Literal

from pydantic import BaseModel, Field

from app.utils.time_utils import now_iso


class ProviderCapabilities(BaseModel):
    provider_name: str = Field(description="Provider identifier, e.g. 'openai'")
    supported_sizes: list[str] = Field(
        description="List of supported image sizes, e.g. '1024x1024'"
    )
    default_size: str = Field(description="Default image size for this provider")
    supported_qualities: list[str] | None = Field(
        default=None, description="Supported quality values, if any"
    )
    supported_styles: list[str] | None = Field(
        default=None, description="Supported style values, if any"
    )
    default_params: dict = Field(
        default_factory=dict, description="Default extra params sent to provider API"
    )
    file_extension: str = Field(
        default="png", description="Image file extension produced by this provider"
    )


class Iteration(BaseModel):
    index: int = Field(description="Zero-based iteration index")
    prompt_text: str = Field(description="Image prompt used in this iteration")
    prompt_diff: str | None = Field(
        default=None, description="Human-readable description of what changed from previous prompt"
    )
    image_path: str | None = Field(
        default=None, description="Local filesystem path to the generated image"
    )
    judge_score: int | None = Field(
        default=None, ge=0, le=100, description="Quality score from judge (0–100)"
    )
    judge_notes: str | None = Field(default=None, description="Textual feedback from the judge")
    user_feedback: str | None = Field(
        default=None, description="Optional feedback provided by the user"
    )
    created_at: str = Field(
        default_factory=now_iso, description="ISO 8601 UTC timestamp of iteration creation"
    )


class Session(BaseModel):
    session_id: str = Field(description="UUID identifying the session")
    user_goal: str = Field(description="User's description of the desired image")
    image_provider: str = Field(
        description="Image generation provider: 'openai' | 'grok' | 'nano_banana'"
    )
    image_params: dict = Field(
        default_factory=dict, description="Provider-specific generation parameters"
    )
    iterations: list[Iteration] = Field(
        default_factory=list, description="All iterations in chronological order"
    )
    status: Literal["draft", "running", "done", "failed"] = Field(
        default="draft",
        description="Session lifecycle status",
    )
    max_iterations: int = Field(
        default=3, ge=1, le=10, description="Maximum number of optimization iterations"
    )
    created_at: str = Field(
        default_factory=now_iso, description="ISO 8601 UTC timestamp of session creation"
    )
    updated_at: str = Field(
        default_factory=now_iso, description="ISO 8601 UTC timestamp of last update"
    )
