#!/usr/bin/env python3
"""Scrape current-season transfer data and store it as a local JSON cache."""

from __future__ import annotations

import argparse
import json
import random
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup, Tag

TRANSFERMARKT_BASE = "https://www.transfermarkt.com"
LATEST_TRANSFERS_URL = f"{TRANSFERMARKT_BASE}/transfers/neuestetransfers/statistik"
DATA_DIR = Path("public/data")
OUTPUT_FILE = DATA_DIR / "transfers_scraped.json"
FALLBACK_FILE = DATA_DIR / "transfers.json"

REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

DATE_FORMATS = (
    "%b %d, %Y",
    "%d/%m/%Y",
    "%Y-%m-%d",
    "%d %b %Y",
)

FEE_PATTERN = re.compile(
    r"(€|£|\$|loan|free|undisclosed|m\b|k\b|bn\b)", re.IGNORECASE
)

DATE_LIKE_PATTERNS = (
    re.compile(r"^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$"),
    re.compile(r"^\d{1,2}/\d{1,2}/\d{4}$"),
    re.compile(r"^\d{4}-\d{2}-\d{2}$"),
    re.compile(r"^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$"),
)


def clean_text(raw: str) -> str:
    return re.sub(r"\s+", " ", raw).strip()


def current_season_label(now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    start_year = now.year if now.month >= 7 else now.year - 1
    return f"{start_year}/{(start_year + 1) % 100:02d}"


def season_from_date(date_value: datetime) -> str:
    start_year = date_value.year if date_value.month >= 7 else date_value.year - 1
    return f"{start_year}/{(start_year + 1) % 100:02d}"


def infer_season_from_window(window_label: str | None) -> str | None:
    if not window_label:
        return None

    season_match = re.search(r"(\d{4})/(\d{2})", window_label)
    if season_match:
        return f"{season_match.group(1)}/{season_match.group(2)}"

    summer_match = re.search(r"summer\s+(\d{4})", window_label, re.IGNORECASE)
    if summer_match:
        start_year = int(summer_match.group(1))
        return f"{start_year}/{(start_year + 1) % 100:02d}"

    winter_match = re.search(r"winter\s+(\d{4})", window_label, re.IGNORECASE)
    if winter_match:
        start_year = int(winter_match.group(1)) - 1
        return f"{start_year}/{(start_year + 1) % 100:02d}"

    return None


def parse_transfer_date(raw_value: str | None) -> datetime | None:
    if not raw_value:
        return None

    value = clean_text(raw_value)
    for date_format in DATE_FORMATS:
        try:
            return datetime.strptime(value, date_format).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def default_window_label(season: str, window_type: str) -> str:
    start_year = int(season.split("/")[0])
    label_year = start_year if window_type == "summer" else start_year + 1
    return f"{window_type.capitalize()} {label_year}"


def classify_window(date_value: datetime) -> tuple[str, str]:
    season = season_from_date(date_value)
    if date_value.month <= 2:
        return "winter", f"Winter {date_value.year}"
    return "summer", default_window_label(season, "summer")


def is_date_like(text: str) -> bool:
    value = clean_text(text)
    return any(pattern.match(value) for pattern in DATE_LIKE_PATTERNS)


def absolute_url(href: str) -> str:
    if href.startswith("http://") or href.startswith("https://"):
        return href
    if href.startswith("/"):
        return f"{TRANSFERMARKT_BASE}{href}"
    return f"{TRANSFERMARKT_BASE}/{href.lstrip('/')}"


def parse_transfer_row(row: Tag, fallback_season: str) -> dict[str, Any] | None:
    player_anchor = row.select_one("a.spielprofil_tooltip")
    if player_anchor is None:
        return None

    player_name = clean_text(player_anchor.get_text(" ", strip=True))
    if not player_name:
        return None

    player_href = clean_text(player_anchor.get("href", ""))
    tm_url = absolute_url(player_href) if player_href else ""

    club_names: list[str] = []
    for club_anchor in row.select("a.vereinprofil_tooltip, a.tm-tooltip-link"):
        candidate = clean_text(
            (club_anchor.get("title") or club_anchor.get_text(" ", strip=True))
        )
        if candidate and candidate not in club_names and candidate != player_name:
            club_names.append(candidate)

    from_club = club_names[0] if len(club_names) > 0 else "Unknown"
    to_club = club_names[1] if len(club_names) > 1 else "Unknown"

    cells = [clean_text(td.get_text(" ", strip=True)) for td in row.select("td")]
    fee = "Undisclosed"
    for value in reversed(cells):
        if FEE_PATTERN.search(value):
            fee = value
            break

    parsed_date: datetime | None = None
    for value in cells:
        if not value or not is_date_like(value):
            continue
        parsed_date = parse_transfer_date(value)
        if parsed_date:
            break

    season = season_from_date(parsed_date) if parsed_date else fallback_season
    if parsed_date:
        window_type, window_label = classify_window(parsed_date)
        window_value = window_label
    else:
        text_blob = " ".join(cells).lower()
        window_type = "winter" if "winter" in text_blob else "summer"
        window_value = default_window_label(season, window_type)

    return {
        "player": player_name,
        "from": from_club,
        "to": to_club,
        "fee": fee,
        "window": window_value,
        "window_type": window_type,
        "season": season,
        "tm_url": tm_url,
    }


def fetch_transfer_page(
    session: requests.Session, page_number: int, timeout_seconds: int
) -> str:
    url = LATEST_TRANSFERS_URL if page_number == 1 else f"{LATEST_TRANSFERS_URL}?page={page_number}"
    response = session.get(url, timeout=timeout_seconds)
    response.raise_for_status()
    return response.text


def scrape_transfermarkt(
    current_season: str,
    max_pages: int,
    delay_seconds: float,
    timeout_seconds: int,
) -> list[dict[str, Any]]:
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)

    transfers: list[dict[str, Any]] = []
    seen_keys: set[tuple[str, str, str, str, str]] = set()
    stale_page_streak = 0

    for page_number in range(1, max_pages + 1):
        html = fetch_transfer_page(session, page_number, timeout_seconds)
        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("table.items tbody tr")
        if not rows:
            break

        page_hits = 0
        parsed_on_page = 0
        for row in rows:
            entry = parse_transfer_row(row, current_season)
            if entry is None:
                continue

            parsed_on_page += 1
            if entry["season"] != current_season:
                continue

            key = (
                entry["player"].lower(),
                entry["from"].lower(),
                entry["to"].lower(),
                entry["fee"].lower(),
                entry["window"],
            )
            if key in seen_keys:
                continue

            seen_keys.add(key)
            transfers.append(entry)
            page_hits += 1

        if parsed_on_page == 0:
            break

        if page_hits == 0:
            stale_page_streak += 1
            if stale_page_streak >= 2:
                break
        else:
            stale_page_streak = 0

        if page_number < max_pages:
            time.sleep(max(0.0, delay_seconds + random.uniform(0, 0.75)))

    return transfers


def read_transfer_list(file_path: Path) -> list[dict[str, Any]]:
    if not file_path.exists():
        return []

    raw_data = json.loads(file_path.read_text(encoding="utf-8"))
    if isinstance(raw_data, list):
        return [item for item in raw_data if isinstance(item, dict)]
    if isinstance(raw_data, dict) and isinstance(raw_data.get("transfers"), list):
        return [item for item in raw_data["transfers"] if isinstance(item, dict)]
    return []


def normalize_fallback_transfer(
    transfer: dict[str, Any], current_season: str
) -> dict[str, Any] | None:
    player = clean_text(str(transfer.get("player", "")))
    if not player:
        return None

    season = str(
        transfer.get("season")
        or infer_season_from_window(str(transfer.get("window", "")))
        or current_season
    )

    window_type = str(transfer.get("window_type", "")).lower()
    if window_type not in ("summer", "winter"):
        window_label = str(transfer.get("window", "")).lower()
        window_type = "winter" if "winter" in window_label else "summer"

    window = str(transfer.get("window") or default_window_label(season, window_type))
    tm_url = str(transfer.get("tm_url") or "").strip()
    if tm_url and not tm_url.startswith("http"):
        tm_url = absolute_url(tm_url)

    return {
        "player": player,
        "from": str(transfer.get("from") or "Unknown"),
        "to": str(transfer.get("to") or "Unknown"),
        "fee": str(transfer.get("fee") or "Undisclosed"),
        "window": window,
        "window_type": window_type,
        "season": season,
        "tm_url": tm_url,
        "fpl_id": transfer.get("fpl_id"),
        "performance": transfer.get("performance"),
    }


def fallback_transfers(current_season: str, file_path: Path) -> list[dict[str, Any]]:
    items = read_transfer_list(file_path)
    normalized: list[dict[str, Any]] = []
    for item in items:
        parsed = normalize_fallback_transfer(item, current_season)
        if parsed:
            normalized.append(parsed)

    season_items = [item for item in normalized if item.get("season") == current_season]
    return season_items if season_items else normalized


def write_payload(file_path: Path, payload: dict[str, Any]) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape Transfermarkt latest transfers into a local JSON cache."
    )
    parser.add_argument(
        "--output",
        default=str(OUTPUT_FILE),
        help="Output JSON file (default: public/data/transfers_scraped.json)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=14,
        help="How many pages of latest transfers to crawl",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2.5,
        help="Base delay (seconds) between page requests",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=12,
        help="Per-request timeout in seconds",
    )
    parser.add_argument(
        "--no-network",
        action="store_true",
        help="Skip web requests and only build cache from fallback file",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    output_file = (repo_root / args.output).resolve()
    fallback_file = (repo_root / FALLBACK_FILE).resolve()

    current_season = current_season_label()
    scrape_error: str | None = None
    transfers: list[dict[str, Any]] = []
    source = "transfermarkt_web_scrape"

    if not args.no_network:
        try:
            transfers = scrape_transfermarkt(
                current_season=current_season,
                max_pages=max(1, args.max_pages),
                delay_seconds=max(0.0, args.delay),
                timeout_seconds=max(3, args.timeout),
            )
        except Exception as exc:  # noqa: BLE001
            scrape_error = str(exc)

    if not transfers:
        transfers = fallback_transfers(current_season, fallback_file)
        source = "fallback_static_file"

    if not transfers:
        print("No transfer records available from scrape or fallback.", flush=True)
        if scrape_error:
            print(f"Scrape error: {scrape_error}", flush=True)
        return 1

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "season": current_season,
        "source": source,
        "count": len(transfers),
        "transfers": transfers,
    }

    write_payload(output_file, payload)
    print(
        f"Saved {len(transfers)} transfers for season {current_season} to {output_file}",
        flush=True,
    )
    if scrape_error:
        print(f"Scrape warning: {scrape_error}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
