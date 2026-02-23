import re


def truncate(text: str, max_len: int) -> str:
    """Truncate text to max_len characters, appending '...' if truncated."""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def slugify(text: str) -> str:
    """Convert arbitrary text to a safe filename-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text
