#!/usr/bin/env python
"""Migrate prompt keys into the Copilot Manager database and export JSON.

This script reads a `prompt.keys.zip` archive containing your Copilot
prompt keys, populates the SQLite database with entries for each key
and its acceptance criteria, and exports JSON files consumed by the
dashboard.  It can be run repeatedly to refresh the database with
newer keys.

Usage:
    python migrate.py --keys path/to/prompt.keys.zip --db path/to/copilot_manager.db

Both arguments are optional.  If not provided, the script looks
for `prompt.keys.zip` in the current working directory and uses
`copilot_manager.db` in the current directory.  Missing files will
raise an error.
"""

import argparse
import json
import os
import sys
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Iterable, List

from db import init_db, drop_tables, connect


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate prompt keys into the database and export JSON.")
    parser.add_argument(
        "--keys",
        dest="keys_zip",
        default="prompt.keys.zip",
        help="Path to the prompt.keys.zip archive. Default: prompt.keys.zip in current directory.",
    )
    parser.add_argument(
        "--db",
        dest="db_path",
        default="copilot_manager.db",
        help="Path to the SQLite database file. Default: copilot_manager.db in current directory.",
    )
    return parser.parse_args()


def extract_key_files(zip_path: str) -> Iterable[tuple[str, str]]:
    """Yield (filename, content) for each file in the ZIP that looks like a key.

    The migration treats every file inside the ZIP as a separate key.  The
    file name (minus its extension) becomes the key name.  The file
    content is passed on for acceptance criteria extraction.  Binary
    files are skipped.

    Args:
        zip_path: Path to the `.zip` archive.
    Yields:
        Tuple of filename and text content.
    """
    with zipfile.ZipFile(zip_path, "r") as zf:
        for info in zf.infolist():
            name = info.filename
            # Skip directories
            if name.endswith("/"):
                continue
            try:
                with zf.open(info, "r") as f:
                    data = f.read()
                    try:
                        text = data.decode("utf-8")
                    except UnicodeDecodeError:
                        # Skip binary files
                        continue
                yield name, text
            except Exception as exc:
                print(f"Warning: failed to read {name}: {exc}", file=sys.stderr)


def extract_acceptance_criteria(text: str) -> List[str]:
    """Extract acceptance criteria lines from a key file's content.

    This helper looks for lines that appear to describe acceptance
    criteria.  It accepts any non‑empty line that starts with a
    dash (`-`), an asterisk (`*`), or is numbered (e.g. `1.`).  If
    no such lines are found, the function returns an empty list.

    Args:
        text: The raw text content of a key file.
    Returns:
        A list of strings, each representing one acceptance criterion.
    """
    criteria: List[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(('-', '*')):
            # remove leading marker
            criteria.append(stripped.lstrip('-* ').strip())
        elif stripped[0].isdigit() and (stripped[1:2] == "." or stripped[1:2].isspace()):
            # numbered list item
            # find first space after the number and optional dot
            parts = stripped.split(None, 1)
            if len(parts) == 2:
                criteria.append(parts[1])
    return criteria


def populate_database(db_path: str, keys_zip: str) -> None:
    """Populate the database from the specified keys archive.

    Drops existing tables, re‑creates them and inserts new rows.  Each
    file in the ZIP archive becomes one key.  Acceptance criteria are
    parsed from each file's content using `extract_acceptance_criteria()`.

    Args:
        db_path: Path to the SQLite database.
        keys_zip: Path to the prompt keys zip archive.
    """
    if not os.path.exists(keys_zip):
        raise FileNotFoundError(f"Keys archive not found: {keys_zip}")

    # Remove any existing tables and re‑create
    drop_tables(db_path)
    init_db(db_path)

    now = datetime.utcnow().replace(microsecond=0).isoformat()

    with connect(db_path) as conn:
        cur = conn.cursor()
        key_map: dict[str, int] = {}

        for filename, content in extract_key_files(keys_zip):
            key_name = Path(filename).stem
            # Insert into Keys table
            cur.execute(
                "INSERT INTO Keys (key_name, created_at, updated_at) VALUES (?, ?, ?)",
                (key_name, now, now),
            )
            key_id = cur.lastrowid
            key_map[key_name] = key_id

            # Extract acceptance criteria
            criteria = extract_acceptance_criteria(content)
            for criterion in criteria:
                cur.execute(
                    "INSERT INTO AcceptanceCriteria (key_id, description, status, created_at, updated_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (key_id, criterion, "Proposed", now, now),
                )

        # Note: UndoLogs are left empty by migration.  They will be populated by the CLI when rollbacks occur.
        # Commit happens automatically in the context manager.


def export_json(db_path: str, data_dir: str) -> None:
    """Export database tables to JSON files for the dashboard.

    Creates three files in `data_dir`: `keys.json`, `criteria.json`
    and `undologs.json`.  Each contains an array of objects
    representing the corresponding table's rows.  All integers
    remain integers; timestamps and text remain as strings.

    Args:
        db_path: Path to the SQLite database.
        data_dir: Directory where JSON files should be written.
    """
    os.makedirs(data_dir, exist_ok=True)
    with connect(db_path) as conn:
        cur = conn.cursor()
        # Keys
        cur.execute("SELECT id, key_name, created_at, updated_at FROM Keys")
        keys = [
            {"id": row[0], "key_name": row[1], "created_at": row[2], "updated_at": row[3]}
            for row in cur.fetchall()
        ]
        with open(os.path.join(data_dir, "keys.json"), "w", encoding="utf-8") as f:
            json.dump(keys, f, indent=2)

        # Criteria
        cur.execute(
            "SELECT id, key_id, description, status, created_at, updated_at FROM AcceptanceCriteria"
        )
        criteria = [
            {
                "id": row[0],
                "key_id": row[1],
                "description": row[2],
                "status": row[3],
                "created_at": row[4],
                "updated_at": row[5],
            }
            for row in cur.fetchall()
        ]
        with open(os.path.join(data_dir, "criteria.json"), "w", encoding="utf-8") as f:
            json.dump(criteria, f, indent=2)

        # Undo logs
        cur.execute("SELECT id, key_id, action, commit_hash, timestamp FROM UndoLogs")
        undologs = [
            {
                "id": row[0],
                "key_id": row[1],
                "action": row[2],
                "commit_hash": row[3],
                "timestamp": row[4],
            }
            for row in cur.fetchall()
        ]
        with open(os.path.join(data_dir, "undologs.json"), "w", encoding="utf-8") as f:
            json.dump(undologs, f, indent=2)


def main() -> None:
    args = parse_arguments()
    db_path = args.db_path
    keys_zip = args.keys_zip

    print(f"Migrating from {keys_zip} into {db_path}...")
    populate_database(db_path, keys_zip)

    data_dir = os.path.join(Path(db_path).parent, "data")
    export_json(db_path, data_dir)
    print(f"Migration complete.  JSON exports written to {data_dir}.")


if __name__ == "__main__":
    main()