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
from datetime import datetime, timezone

from ..models.user import User
from ..models.project import Edital
from ..models.mural import MuralPost
from ..models.job import Job
from ..schemas import EditalOut, EditalFromUrl, JobOut, EditalShare, MuralEditalOut
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


# --- Community mural (defined before /{edital_id} so "mural" isn't parsed as an id) ---

@router.get("/mural", response_model=list[MuralEditalOut])
async def mural(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(MuralPost, User.full_name)
        .join(User, MuralPost.user_id == User.id)
        .order_by(MuralPost.created_at.desc())
        .limit(100)
    )).all()
    return [
        MuralEditalOut(
            id=p.id, title=p.title, summary=p.summary, deadline=p.deadline,
            max_value=p.max_value, source_url=p.source_url,
            requirements=p.requirements, criteria=p.criteria,
            shared_by=name or "Um produtor", shared_at=p.created_at,
            is_mine=(p.user_id == current_user.id),
        )
        for p, name in rows
    ]


@router.post("/mural/{post_id}/import", response_model=EditalOut, status_code=201)
async def import_edital(
    post_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    src = await db.get(MuralPost, post_id)
    if not src:
        raise HTTPException(status_code=404, detail="Post do mural não encontrado")
    copy = Edital(
        user_id=current_user.id, title=src.title, source_url=src.source_url,
        source_filename=src.source_filename, raw_text=src.raw_text, summary=src.summary,
        eligibility=src.eligibility, deadline=src.deadline, max_value=src.max_value,
        requirements=src.requirements, criteria=src.criteria, status="open",
    )
    db.add(copy)
    await db.commit()
    await db.refresh(copy)
    return copy


@router.delete("/mural/{post_id}", status_code=204)
async def delete_mural_post(
    post_id: uuid.UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(MuralPost, post_id)
    if not post or post.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Post do mural não encontrado")
    # Reflect on the source edital's badge if it still exists.
    if post.source_edital_id:
        src = await db.get(Edital, post.source_edital_id)
        if src and src.user_id == current_user.id:
            src.shared = False
            src.shared_at = None
    await db.delete(post)
    await db.commit()


@router.put("/{edital_id}/share", response_model=EditalOut)
async def share_edital(
    edital_id: uuid.UUID,
    data: EditalShare,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Edital).where(Edital.id == edital_id, Edital.user_id == current_user.id)
    )
    edital = result.scalar_one_or_none()
    if not edital:
        raise HTTPException(status_code=404, detail="Edital não encontrado")

    existing = (await db.execute(
        select(MuralPost).where(
            MuralPost.source_edital_id == edital.id,
            MuralPost.user_id == current_user.id,
        )
    )).scalars().all()

    if data.shared:
        if not existing:
            db.add(MuralPost(
                user_id=current_user.id, source_edital_id=edital.id,
                title=edital.title, source_url=edital.source_url,
                source_filename=edital.source_filename, raw_text=edital.raw_text,
                summary=edital.summary, eligibility=edital.eligibility,
                deadline=edital.deadline, max_value=edital.max_value,
                requirements=edital.requirements, criteria=edital.criteria,
            ))
        edital.shared = True
        edital.shared_at = datetime.now(timezone.utc)
    else:
        for post in existing:
            await db.delete(post)
        edital.shared = False
        edital.shared_at = None

    await db.commit()
    await db.refresh(edital)
    return edital


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
