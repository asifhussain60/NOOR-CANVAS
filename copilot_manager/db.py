"""Database schema for Copilot Manager.

This module defines the SQLite schema used by Copilot Manager.  It exposes
helper functions to create and initialise the database.  The schema
contains three tables:

* **Keys** – one row per work item.  Tracks the name, creation time and
  last update time.
* **AcceptanceCriteria** – one row per acceptance criterion, linked to a
  key via `key_id`.  Stores the description, status and timestamps.
* **UndoLogs** – records rollback events.  Each entry stores the key
  affected, the type of action (e.g. rollback), the commit hash
  restored to and the timestamp.

All timestamp fields are stored as ISO 8601 strings (`YYYY‑MM‑DDTHH:MM:SS`).

The helper functions in this file do not depend on any third‑party
packages; only the standard library is used.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from typing import Iterator


@contextmanager
def connect(db_path: str) -> Iterator[sqlite3.Connection]:
    """Context manager yielding a SQLite connection.

    Ensures that the connection is committed on successful exit and
    closed afterwards.

    Args:
        db_path: Path to the SQLite database file.
    Yields:
        sqlite3.Connection: A connection object.
    """
    conn = sqlite3.connect(db_path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: str) -> None:
    """Create the database and its tables if they do not already exist.

    Args:
        db_path: Path to the SQLite database file.
    """
    with connect(db_path) as conn:
        cur = conn.cursor()
        # Keys table
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS Keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        # Acceptance criteria table
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS AcceptanceCriteria (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (key_id) REFERENCES Keys(id)
            );
            """
        )
        # Undo logs table
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS UndoLogs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                commit_hash TEXT,
                timestamp TEXT NOT NULL,
                FOREIGN KEY (key_id) REFERENCES Keys(id)
            );
            """
        )


def drop_tables(db_path: str) -> None:
    """Drop all tables from the database.

    This function is useful when re‑initialising the database during
    development or when migrating from dummy data to real data.

    Args:
        db_path: Path to the SQLite database file.
    """
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("DROP TABLE IF EXISTS UndoLogs;")
        cur.execute("DROP TABLE IF EXISTS AcceptanceCriteria;")
        cur.execute("DROP TABLE IF EXISTS Keys;")
