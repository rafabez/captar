import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_user
from ..models.user import User
from ..models.project import Edital
from ..schemas import EditalOut
from ..services.edital_parser import extract_text
from ..services.ai import ProviderError
from ..services.ai.agents import edital as edital_agent

router = APIRouter(prefix="/editais", tags=["editais"])


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


@router.post("/upload", response_model=EditalOut, status_code=201)
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
    try:
        return await edital_agent.run(current_user, db, raw, file.filename)
    except ProviderError as e:
        raise HTTPException(status_code=400, detail=str(e))
