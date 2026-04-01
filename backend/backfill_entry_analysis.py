import argparse
import json
import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv

if __package__ in (None, ""):
    import sys

    sys.path.append(str(Path(__file__).resolve().parent.parent))
    from backend.hybrid_ml_service import analyze_journal_entry
    from backend.supabase_auth_service import auth_service
else:
    from .hybrid_ml_service import analyze_journal_entry
    from .supabase_auth_service import auth_service


logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

PAGE_SIZE = 200


def fetch_entries(
    user_id: Optional[str] = None,
    entry_id: Optional[int] = None,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    table = auth_service.supabase.table("journal_entries")

    if entry_id is not None:
        response = table.select("*").eq("id", entry_id).execute()
        return response.data or []

    entries: List[Dict[str, Any]] = []
    start = 0

    while True:
        end = start + PAGE_SIZE - 1
        query = table.select("*").order("created_at", desc=False).range(start, end)
        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()
        batch = response.data or []
        if not batch:
            break

        entries.extend(batch)
        if limit is not None and len(entries) >= limit:
            return entries[:limit]

        if len(batch) < PAGE_SIZE:
            break

        start += PAGE_SIZE

    return entries


def normalize_emotions(emotions: Iterable[Any]) -> List[List[Any]]:
    normalized: List[List[Any]] = []
    for item in emotions or []:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            normalized.append([str(item[0]), round(float(item[1]), 3)])
    return normalized


def build_update_payload(content: str) -> Dict[str, Any]:
    analysis = analyze_journal_entry(content)
    emotions_detected = normalize_emotions(analysis.get("emotions_detected", []))
    return {
        "sentiment_score": analysis["sentiment_score"],
        "emotion": analysis["emotion"],
        "emotion_confidence": analysis.get("emotion_confidence"),
        "emotions_detected": emotions_detected,
        "emotion_group": analysis.get("emotion_group"),
        "stress_level": analysis["stress_level"],
        "word_count": len(content.split()),
        "updated_at": __import__("datetime").datetime.utcnow().isoformat(),
    }


def diff_summary(existing: Dict[str, Any], updated: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    keys = [
        "sentiment_score",
        "emotion",
        "emotion_confidence",
        "emotion_group",
        "stress_level",
        "emotions_detected",
        "word_count",
    ]
    summary: Dict[str, Dict[str, Any]] = {}
    for key in keys:
        before = existing.get(key)
        after = updated.get(key)
        if before != after:
            summary[key] = {"before": before, "after": after}
    return summary


def backfill_entries(
    dry_run: bool,
    user_id: Optional[str] = None,
    entry_id: Optional[int] = None,
    limit: Optional[int] = None,
) -> None:
    entries = fetch_entries(user_id=user_id, entry_id=entry_id, limit=limit)
    if not entries:
        logger.info("No journal entries found for the requested scope.")
        return

    logger.info("Found %s entries to analyze.", len(entries))
    updated_count = 0

    for entry in entries:
        content = (entry.get("content") or "").strip()
        if not content:
            logger.info("Skipping entry %s because it has no content.", entry.get("id"))
            continue

        new_payload = build_update_payload(content)
        changes = diff_summary(entry, new_payload)
        if not changes:
            logger.info("Entry %s already matches the current analysis.", entry.get("id"))
            continue

        updated_count += 1
        logger.info("")
        logger.info("Entry %s (%s)", entry.get("id"), entry.get("user_id"))
        logger.info(json.dumps(changes, indent=2, default=str))

        if not dry_run:
            auth_service.supabase.table("journal_entries").update(new_payload).eq(
                "id", entry["id"]
            ).execute()

    logger.info("")
    logger.info(
        "%s complete. %s of %s entries would change.",
        "Dry run" if dry_run else "Backfill",
        updated_count,
        len(entries),
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Re-run journal entry analysis using the current backend analysis pipeline."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview the changes without writing updates to Supabase.",
    )
    parser.add_argument("--user-id", help="Only backfill entries for a specific Supabase user ID.")
    parser.add_argument("--entry-id", type=int, help="Only backfill one journal entry by ID.")
    parser.add_argument("--limit", type=int, help="Only process the first N matching entries.")
    return parser.parse_args()


def main() -> None:
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    args = parse_args()
    backfill_entries(
        dry_run=args.dry_run,
        user_id=args.user_id,
        entry_id=args.entry_id,
        limit=args.limit,
    )


if __name__ == "__main__":
    main()
