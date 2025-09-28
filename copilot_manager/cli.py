#!/usr/bin/env python
"""Copilot Manager command‑line interface (scaffold).

This script offers three high‑level commands that mirror the lifecycle
of a Copilot key: `workitem`, `continue` and `keylock`.  These
commands are intentionally minimal and should be extended to fit your
workflow.  They demonstrate how to create and update entries in the
database but do not perform complex Git operations by default.

Usage examples:

* Start a new key and record an initial note:

    python cli.py workitem --name FEATURE123 --note "Initial analysis"

* Continue work on an existing key in analyse mode:

    python cli.py continue --key FEATURE123 --mode analyze --note "Reviewed design"

* Finalise a key when all acceptance criteria are satisfied:

    python cli.py keylock --key FEATURE123

Run `python cli.py <command> --help` for per‑command options.
"""

import argparse
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

from db import connect, init_db


DB_DEFAULT = "copilot_manager.db"


def ensure_db(path: str) -> None:
    """Initialise the database if it does not exist."""
    if not os.path.exists(path):
        init_db(path)


def commit_checkpoint(message: str) -> str:
    """Create a Git checkpoint commit and return its hash.

    This helper runs `git add -A` and commits with the provided
    message.  It returns the resulting commit hash.  If Git is not
    available or the working directory is not a repository, a dummy
    string is returned instead.
    """
    try:
        # Stage all changes
        subprocess.run(["git", "add", "-A"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Commit
        subprocess.run(["git", "commit", "-m", message], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Get commit hash
        result = subprocess.run(["git", "rev-parse", "HEAD"], check=True, stdout=subprocess.PIPE)
        return result.stdout.decode().strip()
    except Exception as exc:
        print(f"Warning: unable to create Git checkpoint ({exc}).  Skipping commit.")
        return "0000000"


def cmd_workitem(args: argparse.Namespace) -> None:
    """Start a new key and checkpoint the repository."""
    db_path = args.db
    ensure_db(db_path)
    now = datetime.utcnow().replace(microsecond=0).isoformat()
    commit_hash = commit_checkpoint(f"Start workitem {args.name}: {args.note}")
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO Keys (key_name, created_at, updated_at) VALUES (?, ?, ?)",
            (args.name, now, now),
        )
        key_id = cur.lastrowid
        # Insert the initial note as acceptance criterion if provided
        if args.note:
            cur.execute(
                "INSERT INTO AcceptanceCriteria (key_id, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (key_id, args.note, "Proposed", now, now),
            )
        # Record undo log (checkpoint)
        cur.execute(
            "INSERT INTO UndoLogs (key_id, action, commit_hash, timestamp) VALUES (?, ?, ?, ?)",
            (key_id, "checkpoint", commit_hash, now),
        )
    print(f"Created new key '{args.name}' with initial note '{args.note}' and checkpoint {commit_hash}.")


def cmd_continue(args: argparse.Namespace) -> None:
    """Continue work on an existing key.

    The mode can be one of: analyze, apply, test, rollback.  For
    `rollback`, the script records an undo log but does not modify
    Git history by default – you can extend this to call `git reset`
    or similar.  For other modes, a checkpoint commit is created.
    """
    db_path = args.db
    ensure_db(db_path)
    now = datetime.utcnow().replace(microsecond=0).isoformat()
    # Find the key id
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM Keys WHERE key_name = ?", (args.key,))
        row = cur.fetchone()
        if row is None:
            print(f"Error: key '{args.key}' not found in database.")
            return
        key_id = row[0]
    # Commit or rollback
    if args.mode == "rollback":
        # In a real implementation you'd run `git reset --hard <commit>` here.
        commit_hash = "rollback"
        action = "rollback"
    else:
        commit_hash = commit_checkpoint(f"Continue {args.mode} on {args.key}: {args.note}")
        action = f"continue:{args.mode}"
    with connect(db_path) as conn:
        cur = conn.cursor()
        # Update updated_at on the key
        cur.execute("UPDATE Keys SET updated_at = ? WHERE id = ?", (now, key_id))
        # Record undo log
        cur.execute(
            "INSERT INTO UndoLogs (key_id, action, commit_hash, timestamp) VALUES (?, ?, ?, ?)",
            (key_id, action, commit_hash, now),
        )
    print(f"Recorded {args.mode} step on key '{args.key}' with note '{args.note}'.")


def cmd_keylock(args: argparse.Namespace) -> None:
    """Finalise a key by squashing commits and marking criteria as final.

    This implementation marks all criteria for the specified key as
    `Final` and updates the key's `updated_at` timestamp.  It does not
    perform any Git history rewriting by default; extend as needed.
    """
    db_path = args.db
    ensure_db(db_path)
    now = datetime.utcnow().replace(microsecond=0).isoformat()
    with connect(db_path) as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM Keys WHERE key_name = ?", (args.key,))
        row = cur.fetchone()
        if row is None:
            print(f"Error: key '{args.key}' not found in database.")
            return
        key_id = row[0]
        # Mark criteria as Final
        cur.execute(
            "UPDATE AcceptanceCriteria SET status = 'Final', updated_at = ? WHERE key_id = ?",
            (now, key_id),
        )
        # Update key timestamp
        cur.execute(
            "UPDATE Keys SET updated_at = ? WHERE id = ?",
            (now, key_id),
        )
        # Record undo log
        commit_hash = commit_checkpoint(f"Keylock {args.key}")
        cur.execute(
            "INSERT INTO UndoLogs (key_id, action, commit_hash, timestamp) VALUES (?, ?, ?, ?)",
            (key_id, "keylock", commit_hash, now),
        )
    print(f"Key '{args.key}' locked.  All criteria marked as Final and checkpoint {commit_hash} created.")


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Copilot Manager CLI")
    parser.add_argument("--db", default=DB_DEFAULT, help="Path to the database (default: copilot_manager.db)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # workitem
    p_work = subparsers.add_parser("workitem", help="Create a new key and checkpoint the repo")
    p_work.add_argument("--name", required=True, help="Name of the new key")
    p_work.add_argument("--note", default="", help="Initial note or acceptance criterion")
    p_work.set_defaults(func=cmd_workitem)

    # continue
    p_continue = subparsers.add_parser("continue", help="Continue work on a key")
    p_continue.add_argument("--key", required=True, help="Name of the key to continue")
    p_continue.add_argument(
        "--mode",
        choices=["analyze", "apply", "test", "rollback"],
        required=True,
        help="Mode of continuation",
    )
    p_continue.add_argument("--note", default="", help="Note about this step")
    p_continue.set_defaults(func=cmd_continue)

    # keylock
    p_keylock = subparsers.add_parser("keylock", help="Finalize a key and squash commits")
    p_keylock.add_argument("--key", required=True, help="Name of the key to finalise")
    p_keylock.set_defaults(func=cmd_keylock)

    return parser


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()
    # Ensure the database exists or is initialised
    ensure_db(args.db)
    # Dispatch to the selected command
    args.func(args)


if __name__ == "__main__":
    main()