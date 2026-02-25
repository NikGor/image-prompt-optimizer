from typing import Literal

from pydantic import BaseModel, Field


class IterationResponse(BaseModel):
    index: int = Field(description="Zero-based iteration index")
    prompt_text: str = Field(description="Image prompt used in this iteration")
    prompt_diff: str | None = Field(description="What changed from the previous prompt")
    image_url: str | None = Field(
        description="Public URL to the generated image via /media/ endpoint"
    )
    judge_score: int | None = Field(description="Quality score from judge (0–100)")
    judge_notes: str | None = Field(description="Textual feedback from the judge")
    user_feedback: str | None = Field(description="Optional feedback provided by the user")
    created_at: str = Field(description="ISO 8601 UTC timestamp of iteration creation")


class SessionResponse(BaseModel):
    session_id: str = Field(description="UUID identifying the session")
    user_goal: str = Field(description="User's description of the desired image")
    image_provider: str = Field(description="Image generation provider in use")
    image_params: dict = Field(description="Provider-specific generation parameters")
    status: Literal["draft", "running", "done", "failed"] = Field(
        description="Session lifecycle status"
    )
    max_iterations: int = Field(description="Maximum number of optimization iterations")
    iterations: list[IterationResponse] = Field(description="All iterations in chronological order")
    created_at: str = Field(description="ISO 8601 UTC timestamp of session creation")
    updated_at: str = Field(description="ISO 8601 UTC timestamp of last update")


class ErrorResponse(BaseModel):
    code: str = Field(description="Machine-readable error code, e.g. 'validation_error'")
    message: str = Field(description="Human-readable error description")
