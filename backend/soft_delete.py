"""
Soft-Delete Scaffolding — ScaleBoard Bug A Hardening Pattern
===============================================================
Proactive infrastructure for handling destructive operations on business data.

When the app needs to "delete" something valuable (an order, a payment, a pet,
or anything else where we'd want to recover it later), call `soft_delete()`
instead of `db.collection.delete_one()`.

What it does:
1. Moves the full document to `<collection>_deleted` with full audit fields
   added: `deleted_by_id`, `deleted_by_email`, `deleted_by_name`, `deleted_by_role`,
   `deleted_at` (UTC ISO), `deleted_via_route`, `reason`.
2. Then calls delete_one() on the original collection.
3. Returns the snapshot so callers can inspect what was moved.

Restoration (CEO-only):
    await soft_restore(db, "orders", order_id)

List deleted:
    await list_soft_deleted(db, "orders", limit=50)

Usage in a route handler:
    from soft_delete import soft_delete
    @router.delete("/orders/{order_id}")
    async def delete_order(order_id: str, user=Depends(get_current_user)):
        result = await soft_delete(
            db=db,
            collection="orders",
            doc_filter={"id": order_id},
            actor={"id": user.id, "email": user.email, "name": user.name, "role": user.role},
            reason="admin cancellation",
            via_route=f"DELETE /api/orders/{order_id}",
        )
        return result

CEO-only list + restore endpoints are registered in `admin_soft_delete_routes.py`.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


async def soft_delete(
    db,
    collection: str,
    doc_filter: Dict[str, Any],
    actor: Dict[str, Any],
    reason: str = "",
    via_route: str = "",
) -> Dict[str, Any]:
    """Move a document to `<collection>_deleted` with audit fields, then delete the original.

    Args:
        db: Motor async database handle.
        collection: Name of the source collection (e.g. "orders").
        doc_filter: Mongo filter to locate the doc (e.g. {"id": order_id}).
        actor: Dict with id/email/name/role of the user performing the deletion.
        reason: Human-readable reason ("admin cancellation", "customer refund", etc.).
        via_route: The HTTP method + path that invoked this (for forensics).

    Returns:
        {
          "status": "deleted" | "not_found",
          "snapshot": {...}  # Full doc as it was moved to *_deleted,
          "deleted_collection": "<collection>_deleted",
        }

    NEVER call delete_one() directly on orders / payments / invoices /
    transactions / subscriptions. Always route through here.
    """
    doc = await db[collection].find_one(doc_filter, {"_id": 0})
    if not doc:
        return {"status": "not_found", "snapshot": None, "deleted_collection": f"{collection}_deleted"}

    snapshot = dict(doc)  # shallow copy
    snapshot.update({
        "deleted_by_id":    (actor or {}).get("id"),
        "deleted_by_email": (actor or {}).get("email"),
        "deleted_by_name":  (actor or {}).get("name"),
        "deleted_by_role":  (actor or {}).get("role"),
        "deleted_at":       datetime.now(timezone.utc).isoformat(),
        "reason":           reason,
        "deleted_via_route": via_route,
        "source_collection": collection,
    })

    deleted_coll = f"{collection}_deleted"
    try:
        await db[deleted_coll].insert_one(snapshot)
    except Exception as e:
        logger.exception(f"[SOFT-DELETE] Failed to insert into {deleted_coll}: {e}")
        # Re-raise — we do NOT want to proceed with delete_one if the audit
        # trail failed. Better to leave the doc alive than lose it silently.
        raise

    # Only now delete from the live collection. If this fails, the snapshot
    # is in *_deleted (maybe duplicated on retry) but nothing was lost.
    await db[collection].delete_one(doc_filter)

    logger.info(
        f"[SOFT-DELETE] {collection} doc filter={doc_filter} → {deleted_coll} "
        f"by {snapshot['deleted_by_email']} via {via_route}"
    )

    # Return a copy without the Mongo-injected _id (if any)
    snapshot.pop("_id", None)
    return {"status": "deleted", "snapshot": snapshot, "deleted_collection": deleted_coll}


async def soft_restore(
    db,
    collection: str,
    doc_id: str,
    actor: Dict[str, Any],
    id_field: str = "id",
) -> Dict[str, Any]:
    """Move a soft-deleted doc back to its original collection.
    Removes the audit fields on the way back. Appends `_restored_from_deleted`
    metadata to the restored doc so forensics can still find the trail.
    """
    deleted_coll = f"{collection}_deleted"
    doc = await db[deleted_coll].find_one({id_field: doc_id}, {"_id": 0})
    if not doc:
        return {"status": "not_found"}

    restored = dict(doc)
    # Pop audit fields before restoring
    audit_snapshot = {
        "deleted_by_email": restored.pop("deleted_by_email", None),
        "deleted_at":       restored.pop("deleted_at", None),
        "reason":           restored.pop("reason", None),
    }
    for k in ("deleted_by_id", "deleted_by_name", "deleted_by_role",
              "deleted_via_route", "source_collection"):
        restored.pop(k, None)

    restored["_restored_from_deleted"] = {
        "restored_at":      datetime.now(timezone.utc).isoformat(),
        "restored_by_email": (actor or {}).get("email"),
        "previous_audit":   audit_snapshot,
    }

    # Check the original collection doesn't already contain this id
    existing = await db[collection].find_one({id_field: doc_id}, {"_id": 0})
    if existing:
        return {"status": "conflict", "message": f"{collection}.{id_field}={doc_id} already exists"}

    await db[collection].insert_one(restored)
    await db[deleted_coll].delete_one({id_field: doc_id})

    logger.info(
        f"[SOFT-RESTORE] {collection}.{doc_id} restored by {(actor or {}).get('email')}"
    )
    return {"status": "restored", "doc": restored}


async def list_soft_deleted(db, collection: str, limit: int = 50):
    """List recently-deleted documents from `<collection>_deleted`."""
    deleted_coll = f"{collection}_deleted"
    cursor = db[deleted_coll].find({}, {"_id": 0}).sort("deleted_at", -1).limit(limit)
    docs = []
    async for d in cursor:
        docs.append(d)
    total = await db[deleted_coll].count_documents({})
    return {"collection": deleted_coll, "total": total, "docs": docs}
