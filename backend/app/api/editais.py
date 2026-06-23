import ipaddress
import socket
import uuid
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.project import Edital
from ..models.job import Job
from ..schemas import EditalOut, EditalFromUrl, JobOut
from ..services.edital_parser import extract_text
from ..workers.queue import get_pool

router = APIRouter(prefix="/editais", tags=["editais"])

MAX_PDF_BYTES = 25 * 1024 * 1024


def _ensure_public_url(url: str) -> str:
    """Block non-http(s) schemes and hosts that resolve to private/loopback IPs (SSRF)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="URL deve começar com http:// ou https://")
    if not parsed.hostname:
        raise HTTPException(status_code=400, detail="URL inválida")
    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Não foi possível resolver o domínio")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise HTTPException(status_code=400, detail="URL não permitida")
    return url


@router.get("", response_model=list[EditalOut])
async def list_editais(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Edital)
        .where(Edital.user_id == current_user.id)
        .order_by(Edital.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{edital_id}", response_model=EditalOut)
async def get_edital(
    edital_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Edital).where(Edital.id == edital_id, Edital.user_id == current_user.id)
    )
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    return edital


async def _enqueue_edital(
    user: User, db: AsyncSession, raw: str, *, filename=None, source_url=None
) -> Job:
    job = Job(user_id=user.id, kind="edital")
    db.add(job)
    await db.commit()
    await db.refresh(job)
    pool = await get_pool()
    await pool.enqueue_job("run_edital_job", str(job.id), str(user.id), raw, filename, source_url)
    return job


@router.delete("/{edital_id}", status_code=204)
async def delete_edital(
    edital_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Edital).where(Edital.id == edital_id, Edital.user_id == current_user.id)
    )
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")
    await db.delete(edital)
    await db.commit()


@router.post("/upload", response_model=JobOut, status_code=202)
async def upload_edital(
    file: UploadFile = File(...),
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    try:
        raw = extract_text(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler o PDF: {e}")
    if not raw.strip():
        raise HTTPException(
            status_code=400,
            detail="PDF sem texto extraível (provavelmente digitalizado/imagem).",
        )
    return await _enqueue_edital(current_user, db, raw, filename=file.filename)


@router.post("/from-url", response_model=JobOut, status_code=202)
async def edital_from_url(
    data: EditalFromUrl,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    url = _ensure_public_url(data.url.strip())
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "CAPTAR/1.0"})
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Não foi possível baixar o PDF: {e}")
    if resp.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"O link retornou {resp.status_code}")
    if len(resp.content) > MAX_PDF_BYTES:
        raise HTTPException(status_code=400, detail="PDF muito grande (máx 25MB)")

    try:
        raw = extract_text(resp.content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Não foi possível ler o PDF: {e}")
    if not raw.strip():
        raise HTTPException(
            status_code=400,
            detail="Sem texto extraível — o link pode não ser um PDF ou ser digitalizado.",
        )

    filename = url.rsplit("/", 1)[-1] or None
    return await _enqueue_edital(current_user, db, raw, source_url=url, filename=filename)
