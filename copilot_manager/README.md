# Copilot Manager

Copilot Manager is a lightweight, self‑hosted companion for managing the lifecycle of your GitHub Copilot prompts.  It helps you keep track of keys (work items), acceptance criteria and undo logs via a Git‑backed workflow.  A static HTML dashboard gives you at‑a‑glance insight into progress and lets you drill down into individual keys.

## Features

* **Database backed by SQLite** – Tracks keys, acceptance criteria and undo logs.
* **Migration script** – Loads your `prompt.keys.zip` archive into the database and exports JSON data for the dashboard.
* **Self‑contained dashboard** – Built with Tailwind CSS, Chart.js, Tabulator and other open source libraries.  No server required; just open `views/index.html` in a browser.
* **Command‑line scaffolding** – `cli.py` offers a starting point for `/workitem`, `/continue` and `/keylock` commands.
* **Simple setup** – Run `setup.bat` once to create a virtual environment, migrate your data and open the dashboard.

## Getting Started

### 1. Place your `prompt.keys.zip`

Copy the latest `prompt.keys.zip` (containing your Copilot prompt keys) into the root of your project.  The setup script will ask for the full path.

### 2. Run Setup

Open a terminal or PowerShell in the project root and run:

```bat
copilot_manager\setup.bat
```

The script will:

1. Create a Python virtual environment in `copilot_manager/.venv` (if one doesn't exist).
2. Install any Python dependencies listed in `requirements.txt`.
3. Ask for the location of `prompt.keys.zip` and the path where the database should be created (defaults to `copilot_manager/copilot_manager.db`).
4. Run the migration to import your keys into the database and export JSON files to `copilot_manager/data`.
5. Optionally open the dashboard in your default browser.

### 3. Explore the Dashboard

Open `copilot_manager/views/index.html` in your browser.  The dashboard comprises five views:

* **Dashboard View** – Overview of all keys and acceptance criteria status.
* **Key Progress View** – Timeline of commits and acceptance criteria for a single key.
* **Acceptance Criteria Explorer** – Filterable table of all criteria across keys.
* **Timeline View** – Parallel timeline showing multiple keys over time.
* **Rollback & Activity Feed** – History of rollbacks and recent actions.

### 4. Refresh Data

When you receive an updated `prompt.keys.zip`, run:

```bat
copilot_manager\refresh.bat
```

This script re‑runs the migration and updates the database and JSON exports without reinstalling anything.

### 5. Command‑Line Interface

The `cli.py` script provides a scaffold for lifecycle commands:

* `/workitem` – Start a new work item (key) and checkpoint the repository.
* `/continue` – Continue work on an existing key, with options to analyse, apply changes, test, or rollback.
* `/keylock` – Finalise a key by squashing commits and ensuring all criteria are satisfied.

Run `python cli.py --help` in the `copilot_manager` directory to see available options.  The CLI is intentionally minimal; feel free to extend it using GitHub Copilot to suit your workflow.

## Folder Structure

```
copilot_manager/
├── db.py           # SQLite schema definitions
├── migrate.py      # Migration script from prompt.keys.zip → DB + JSON
├── cli.py          # Scaffold for lifecycle commands (workitem, continue, keylock)
├── requirements.txt# Python dependencies
├── instruction.txt # Usage guide (plain text)
├── README.md       # This file
├── setup.bat       # Interactive installer
├── refresh.bat     # Data refresh script
├── data/           # JSON exports for the dashboard
├── views/
│   ├── index.html  # Dashboard entry point
│   ├── js/         # JavaScript modules for each view
│   └── css/        # Custom CSS (mostly Tailwind loaded via CDN)
└── copilot_manager.db # SQLite database (initially dummy data, overwritten on setup)
```

## Extending and Customising

This project is designed as a starting point.  You can:

* Enhance the CLI to meet your exact workflow requirements.
* Adapt `migrate.py` to parse your `.keys` files differently if the format changes.
* Expand the dashboard by editing or adding JavaScript modules in `views/js/`.
* Replace or add front‑end libraries as needed; all dependencies are loaded via CDN.

## License

This project is provided as‑is under the MIT License.  See [LICENSE](LICENSE) for details.
