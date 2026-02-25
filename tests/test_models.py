import pytest

from app.models.domain_models import Iteration, ProviderCapabilities, Session
from app.models.request_models import (
    CreateSessionRequest,
    FeedbackRequest,
    RunOptimizeRequest,
    UpdatePromptRequest,
)
from app.models.response_models import ErrorResponse, IterationResponse, SessionResponse


class TestDomainModels:
    def test_iteration_defaults(self):
        iteration = Iteration(index=0, prompt_text="a photo of a cat")
        assert iteration.index == 0
        assert iteration.prompt_text == "a photo of a cat"
        assert iteration.prompt_diff is None
        assert iteration.image_path is None
        assert iteration.judge_score is None
        assert iteration.judge_notes is None
        assert iteration.user_feedback is None
        assert iteration.created_at is not None

    def test_iteration_judge_score_bounds(self):
        with pytest.raises(Exception):
            Iteration(index=0, prompt_text="x", judge_score=101)
        with pytest.raises(Exception):
            Iteration(index=0, prompt_text="x", judge_score=-1)
        valid = Iteration(index=0, prompt_text="x", judge_score=0)
        assert valid.judge_score == 0
        valid_max = Iteration(index=0, prompt_text="x", judge_score=100)
        assert valid_max.judge_score == 100

    def test_session_defaults(self):
        session = Session(
            session_id="abc-123",
            user_goal="a sunset over the ocean",
            image_provider="openai",
        )
        assert session.status == "draft"
        assert session.max_iterations == 3
        assert session.iterations == []
        assert session.image_params == {}
        assert session.created_at is not None
        assert session.updated_at is not None

    def test_session_invalid_status(self):
        with pytest.raises(Exception):
            Session(
                session_id="abc",
                user_goal="test",
                image_provider="openai",
                status="unknown",
            )

    def test_session_max_iterations_bounds(self):
        with pytest.raises(Exception):
            Session(session_id="x", user_goal="x", image_provider="openai", max_iterations=0)
        with pytest.raises(Exception):
            Session(session_id="x", user_goal="x", image_provider="openai", max_iterations=11)

    def test_session_with_iterations(self):
        iteration = Iteration(index=0, prompt_text="sunset", judge_score=75)
        session = Session(
            session_id="s1",
            user_goal="sunset",
            image_provider="grok",
            iterations=[iteration],
        )
        assert len(session.iterations) == 1
        assert session.iterations[0].judge_score == 75

    def test_provider_capabilities(self):
        caps = ProviderCapabilities(
            provider_name="openai",
            supported_sizes=["1024x1024", "1792x1024"],
            default_size="1024x1024",
            supported_qualities=["standard", "hd"],
            file_extension="png",
        )
        assert caps.provider_name == "openai"
        assert "1024x1024" in caps.supported_sizes
        assert caps.default_params == {}

    def test_session_serialization(self):
        session = Session(session_id="s1", user_goal="test", image_provider="openai")
        data = session.model_dump()
        restored = Session.model_validate(data)
        assert restored.session_id == session.session_id
        assert restored.status == session.status


class TestRequestModels:
    def test_create_session_request_defaults(self):
        req = CreateSessionRequest(user_goal="a red balloon")
        assert req.image_provider == "openai"
        assert req.max_iterations == 3
        assert req.image_params == {}

    def test_create_session_request_custom(self):
        req = CreateSessionRequest(
            user_goal="a dragon",
            image_provider="grok",
            max_iterations=5,
            image_params={"size": "1024x1024"},
        )
        assert req.image_provider == "grok"
        assert req.max_iterations == 5

    def test_update_prompt_request(self):
        req = UpdatePromptRequest(prompt_text="new prompt")
        assert req.prompt_text == "new prompt"

    def test_feedback_request(self):
        req = FeedbackRequest(feedback_text="make it brighter")
        assert req.feedback_text == "make it brighter"

    def test_run_optimize_request_defaults(self):
        req = RunOptimizeRequest()
        assert req.max_iterations is None

    def test_run_optimize_request_override(self):
        req = RunOptimizeRequest(max_iterations=2)
        assert req.max_iterations == 2


class TestResponseModels:
    def test_iteration_response(self):
        resp = IterationResponse(
            index=0,
            prompt_text="cat",
            prompt_diff=None,
            image_url="/media/s1/iter_0.png",
            judge_score=80,
            judge_notes="good composition",
            user_feedback=None,
            created_at="2026-01-01T00:00:00+00:00",
        )
        assert resp.image_url == "/media/s1/iter_0.png"
        assert resp.judge_score == 80

    def test_session_response(self):
        resp = SessionResponse(
            session_id="s1",
            user_goal="cat",
            image_provider="openai",
            image_params={},
            status="done",
            max_iterations=3,
            iterations=[],
            created_at="2026-01-01T00:00:00+00:00",
            updated_at="2026-01-01T01:00:00+00:00",
        )
        assert resp.status == "done"
        assert resp.iterations == []

    def test_error_response(self):
        err = ErrorResponse(code="validation_error", message="field required: user_goal")
        assert err.code == "validation_error"
        data = err.model_dump()
        assert data["code"] == "validation_error"
