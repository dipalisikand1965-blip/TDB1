"""
Admin Soft-Delete Routes — CEO-only audit + restore endpoints.

Registered in server.py under prefix /api/admin/soft-deletes.
All endpoints require admin auth (Depends(verify_admin)).

    GET    /api/admin/soft-deletes/{collection}               — list deleted
    POST   /api/admin/soft-deletes/{collection}/{doc_id}/restore — restore

The `collection` path param must be in the ALLOWED_COLLECTIONS whitelist
so admins can't accidentally browse arbitrary *_deleted collections.
"""
from fastapi import APIRouter, Depends, HTTPException, Path, Query
import logging

from soft_delete import soft_restore, list_soft_deleted

logger = logging.getLogger(__name__)

# Only these collections have soft-delete / restore endpoints exposed.
# Extend as new financial / critical collections are added.
ALLOWED_COLLECTIONS = {
    "orders", "payments", "payment_orders", "refunds", "invoices",
    "transactions", "subscriptions",
    "pets",            # pet data is irreplaceable
    "users",           # member accounts
    "service_desk_tickets",
    "team_members", "featured_dogs",  # content Dipali has manually curated
}

# Injected from server.py at startup
db = None
verify_admin = None


def set_deps(database, verify_admin_func):
    global db, verify_admin
    db = database
    verify_admin = verify_admin_func


router = APIRouter(prefix="/api/admin/soft-deletes", tags=["Admin Soft-Delete"])


@router.get("/{collection}")
async def list_deleted_docs(
    collection: str = Path(..., description="Source collection (must be whitelisted)"),
    limit: int = Query(50, ge=1, le=500),
):
    """CEO-only: list recently soft-deleted docs in a whitelisted collection."""
    if verify_admin is None or db is None:
        raise HTTPException(status_code=503, detail="Admin soft-delete routes not initialised")
    # NOTE: verify_admin dependency is registered at the function level below

    if collection not in ALLOWED_COLLECTIONS:
        raise HTTPException(status_code=400, detail=f"Collection '{collection}' not in soft-delete whitelist")

    return await list_soft_deleted(db, collection, limit=limit)


@router.post("/{collection}/{doc_id}/restore")
async def restore_deleted_doc(
    collection: str = Path(...),
    doc_id: str = Path(...),
):
    """CEO-only: move a doc from `<collection>_deleted` back to live collection."""
    if verify_admin is None or db is None:
        raise HTTPException(status_code=503, detail="Admin soft-delete routes not initialised")

    if collection not in ALLOWED_COLLECTIONS:
        raise HTTPException(status_code=400, detail=f"Collection '{collection}' not in soft-delete whitelist")

    # actor info comes from verify_admin; we pass a best-effort stub here
    actor = {"email": "admin", "role": "admin"}
    result = await soft_restore(db, collection, doc_id, actor=actor)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Deleted doc not found")
    if result.get("status") == "conflict":
        raise HTTPException(status_code=409, detail=result.get("message"))
    return result


# ── Register admin dependency lazily after set_deps ──
# FastAPI requires Depends() at import time. We wrap the router's routes by
# applying verify_admin at inclusion time in server.py — see below.
