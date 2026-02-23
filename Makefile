export PATH := $(HOME)/.local/bin:$(PATH)

format:
	poetry run ruff format app/ tests/

lint:
	poetry run ruff check app/ tests/

check: lint
	poetry run mypy app/

fix:
	poetry run ruff check --fix app/ tests/
	poetry run ruff format app/ tests/

ruff-fix:
	poetry run ruff check --fix app/ tests/
