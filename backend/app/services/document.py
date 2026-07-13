import os

from langchain.text_splitter import RecursiveCharacterTextSplitter


class DocumentService:
    """Parse and chunk documents for RAG ingestion."""

    CHUNK_SIZE = 800
    CHUNK_OVERLAP = 100

    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.CHUNK_SIZE,
            chunk_overlap=self.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def parse(self, file_path: str) -> str:
        """Parse a document file to plain text."""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return self._parse_pdf(file_path)
        elif ext == ".docx":
            return self._parse_docx(file_path)
        elif ext == ".txt":
            return self._parse_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def chunk(self, text: str) -> list[str]:
        """Split text into overlapping chunks."""
        return self.text_splitter.split_text(text)

    def parse_and_chunk(self, file_path: str) -> tuple[str, list[str]]:
        """Parse a document and split into chunks. Returns (full_text, chunks)."""
        full_text = self.parse(file_path)
        chunks = self.chunk(full_text)
        return full_text, chunks

    def _parse_pdf(self, file_path: str) -> str:
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        texts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                texts.append(text)
        return "\n\n".join(texts)

    def _parse_docx(self, file_path: str) -> str:
        from docx import Document

        doc = Document(file_path)
        texts = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(texts)

    def _parse_txt(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()


# Singleton
document_service = DocumentService()
