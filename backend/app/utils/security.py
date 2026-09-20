import ipaddress
import os
import re
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status


def sanitize_filename(filename: str) -> str:
    cleaned = os.path.basename(filename)
    cleaned = re.sub(r"[^\w\s\.-]", "", cleaned)
    cleaned = re.sub(r"\s+", "_", cleaned)
    if not cleaned or cleaned.startswith("."):
        cleaned = f"document_{cleaned}"
    if not cleaned.lower().endswith(".pdf"):
        cleaned = f"{cleaned}.pdf"
    return cleaned


def validate_pdf_content(content: bytes, max_size_bytes: int) -> None:
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty"
        )
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_size_bytes} bytes"
        )
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not have a valid PDF header"
        )


def validate_external_url(url: str) -> str:
    try:
        parsed = urlparse(url)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL structure"
        )

    if parsed.scheme not in ("http", "https"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only HTTP and HTTPS protocols are permitted"
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing URL hostname"
        )

    try:
        ip_addr = socket.gethostbyname(hostname)
        ip = ipaddress.ip_address(ip_addr)
        if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access to private or internal network addresses is prohibited"
            )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to resolve host: {hostname}"
        )

    return url
