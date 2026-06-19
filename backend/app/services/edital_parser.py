"""Extract plain text from an edital PDF using PyMuPDF."""
import fitz  # PyMuPDF

MAX_CHARS = 30_000  # cap to keep the prompt within model context


def extract_text(data: bytes) -> str:
    parts: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            parts.append(page.get_text())
    return "\n".join(parts).strip()[:MAX_CHARS]
