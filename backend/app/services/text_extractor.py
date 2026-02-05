"""Text extraction service.

Ce module fournit des fonctions pour extraire le texte de documents.
"""

import io
from pathlib import Path

import pdfplumber


def extract_text_from_pdf(file_path: str | Path) -> str:
    """Extrait le texte d'un fichier PDF.

    Args:
        file_path: Chemin vers le fichier PDF

    Returns:
        Le texte extrait

    Raises:
        ValueError: Si l'extraction échoue
    """
    try:
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        return "\n\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Erreur lors de l'extraction du PDF: {e}")


def extract_text_from_docx(file_path: str | Path) -> str:
    """Extrait le texte d'un fichier DOCX.

    Args:
        file_path: Chemin vers le fichier DOCX

    Returns:
        Le texte extrait

    Raises:
        ValueError: Si l'extraction échoue
    """
    try:
        from docx import Document

        doc = Document(file_path)
        text_parts = []

        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text)

        return "\n\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Erreur lors de l'extraction du DOCX: {e}")


def extract_text(file_path: str | Path, file_type: str | None = None) -> str:
    """Extrait le texte d'un document selon son type.

    Args:
        file_path: Chemin vers le fichier
        file_type: Type MIME du fichier (optionnel)

    Returns:
        Le texte extrait

    Raises:
        ValueError: Si le type de fichier n'est pas supporté ou si l'extraction échoue
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    # Détermine le type à partir de l'extension ou du MIME type
    if file_type == "application/pdf" or ext == ".pdf":
        return extract_text_from_pdf(path)
    elif (
        file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        or ext == ".docx"
    ):
        return extract_text_from_docx(path)
    else:
        raise ValueError(f"Type de fichier non supporté: {ext or file_type}")
