#!/usr/bin/env python3
"""
generate-evidence-chain.py

Generates a markdown summary linking protocols, source files, tests, and mutation scores.
Reads:
  - docs/protocols/*.md (protocol documents)
  - frontend/reports/mutation/mutants.json (Stryker output)
  - backend/mutants.out/mutants.json (cargo-mutants output, if present)

Outputs:
  - evidence-chain.md (markdown summary)
  - evidence-chain.json (machine-readable summary)

Usage:
  python3 scripts/generate-evidence-chain.py
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime, timezone

REPO_ROOT = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Protocol-to-source mapping (extend as needed)
# ---------------------------------------------------------------------------
PROTOCOL_MAP = [
    {
        "protocol": "Typer",
        "doc": "docs/protocols/typer.md",
        "src": "frontend/src/typer.ts",
        "tests": ["frontend/src/typer.test.ts"],
    },
    {
        "protocol": "Text Renderer",
        "doc": "docs/protocols/text-renderer.md",
        "src": "frontend/src/textRenderer.ts",
        "tests": ["frontend/src/textRenderer.test.ts"],
    },
    {
        "protocol": "Chord Serialization",
        "doc": "docs/protocols/chord-serialization.md",
        "src": "frontend/src/device/chordSerialization.ts",
        "tests": ["frontend/src/device/chordSerialization.test.ts"],
    },
    {
        "protocol": "Chord Manager",
        "doc": "docs/protocols/chord-manager.md",
        "src": "frontend/src/chordManager.ts",
        "tests": ["frontend/src/chordManager.test.ts"],
    },
]

# ---------------------------------------------------------------------------
# Backend modules (no protocol docs yet, but we can still report mutation scores)
# ---------------------------------------------------------------------------
BACKEND_MODULES = [
    {"src": "backend/src/app.rs", "tests": ["backend/tests/integration.rs"]},
    {"src": "backend/src/lib.rs", "tests": []},
    {"src": "backend/src/main.rs", "tests": []},
    {"src": "backend/src/routes.rs", "tests": []},
    {"src": "backend/src/state.rs", "tests": []},
]


def load_stryker_json(path: Path):
    if not path.exists():
        return {}
    with open(path, "r") as f:
        return json.load(f)


def load_cargo_mutants_json(path: Path):
    """cargo-mutants writes a JSON file per source file under mutants.out/*.json"""
    if not path.exists():
        return {}
    results = {}
    for json_file in path.glob("*.json"):
        try:
            with open(json_file, "r") as f:
                data = json.load(f)
            # cargo-mutants JSON schema varies; handle common shapes
            if isinstance(data, dict):
                file_key = data.get("file", json_file.stem)
                results[file_key] = data
            elif isinstance(data, list):
                for item in data:
                    file_key = item.get("file", json_file.stem)
                    results[file_key] = item
        except Exception:
            continue
    return results


def mutation_score_from_stryker(entry: dict) -> dict:
    survived = entry.get("survived_count", 0)
    nocov = entry.get("nocov_count", 0)
    total = survived + nocov
    # Stryker doesn't give killed count directly in this schema; we approximate
    # score = 1 - (survived / total) if total else None
    score = None
    if total > 0:
        score = round((1 - survived / total) * 100, 1)
    return {
        "total_mutants": total,
        "survived": survived,
        "nocov": nocov,
        "score_percent": score,
    }


def mutation_score_from_cargo_mutants(entry: dict) -> dict:
    # cargo-mutants JSON often has "outcomes" or counts
    outcomes = entry.get("outcomes", [])
    if not outcomes and "mutants" in entry:
        outcomes = entry["mutants"]
    total = len(outcomes) if isinstance(outcomes, list) else 0
    survived = 0
    nocov = 0
    if isinstance(outcomes, list):
        for o in outcomes:
            status = o.get("status", "").lower()
            if status == "survived":
                survived += 1
            elif status == "uncaught" or status == "timeout":
                survived += 1
            elif status == "missed" or status == "unviable":
                nocov += 1
    score = None
    if total > 0:
        score = round((1 - survived / total) * 100, 1)
    return {
        "total_mutants": total,
        "survived": survived,
        "nocov": nocov,
        "score_percent": score,
    }


def file_exists(path: str) -> bool:
    return (REPO_ROOT / path).exists()


def generate_markdown(frontend_data: dict, backend_data: dict) -> str:
    now = datetime.now(timezone.utc).isoformat()
    lines = [
        "# Evidence Chain — Protocols ↔ Implementation ↔ Tests ↔ Mutation Scores",
        "",
        f"_Generated at {now}Z_",
        "",
        "This document links every protocol to its implementation, tests, and mutation-testing results.",
        "",
        "## Frontend",
        "",
    ]

    for p in PROTOCOL_MAP:
        doc_exists = file_exists(p["doc"])
        src_exists = file_exists(p["src"])
        test_exists = all(file_exists(t) for t in p["tests"])

        key = p["src"].replace("frontend/", "")
        stryker = frontend_data.get(key, {})
        score_info = mutation_score_from_stryker(stryker)

        lines.append(f"### {p['protocol']}")
        lines.append("")
        lines.append(f"- **Protocol doc**: `{p['doc']}` {'✅' if doc_exists else '❌ missing'}")
        lines.append(f"- **Source**: `{p['src']}` {'✅' if src_exists else '❌ missing'}")
        for t in p["tests"]:
            lines.append(f"- **Test**: `{t}` {'✅' if file_exists(t) else '❌ missing'}")
        if score_info["score_percent"] is not None:
            lines.append(
                f"- **Mutation score**: {score_info['score_percent']}% "
                f"({score_info['survived']} survived / {score_info['total_mutants']} total)"
            )
        else:
            lines.append("- **Mutation score**: _no data_")
        lines.append("")

    lines.append("## Backend")
    lines.append("")
    for m in BACKEND_MODULES:
        src_exists = file_exists(m["src"])
        key = Path(m["src"]).name  # cargo-mutants often keys by filename
        # Try exact match then basename match
        cm = backend_data.get(m["src"]) or backend_data.get(key) or {}
        score_info = mutation_score_from_cargo_mutants(cm)

        lines.append(f"### {key}")
        lines.append("")
        lines.append(f"- **Source**: `{m['src']}` {'✅' if src_exists else '❌ missing'}")
        for t in m["tests"]:
            lines.append(f"- **Test**: `{t}` {'✅' if file_exists(t) else '❌ missing'}")
        if score_info["score_percent"] is not None:
            lines.append(
                f"- **Mutation score**: {score_info['score_percent']}% "
                f"({score_info['survived']} survived / {score_info['total_mutants']} total)"
            )
        else:
            lines.append("- **Mutation score**: _no data_")
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## Legend")
    lines.append("")
    lines.append("- **Mutation score** = percentage of mutants killed by the test suite.")
    lines.append("- **survived** = mutants that passed all tests (weak oracle).")
    lines.append("- **nocov** = mutants in uncovered code (missing tests).")
    lines.append("")
    lines.append("## CI Artifacts")
    lines.append("")
    lines.append("- `stryker-results` — Full Stryker HTML/JSON report (`frontend/reports/mutation/`)")
    lines.append("- `cargo-mutants-results` — Full cargo-mutants output (`backend/mutants.out/`)")
    lines.append("- `evidence-chain` — This summary (`evidence-chain.md` + `evidence-chain.json`)")
    lines.append("")

    return "\n".join(lines)


def generate_json(frontend_data: dict, backend_data: dict) -> dict:
    records = []
    for p in PROTOCOL_MAP:
        key = p["src"].replace("frontend/", "")
        stryker = frontend_data.get(key, {})
        score_info = mutation_score_from_stryker(stryker)
        records.append(
            {
                "protocol": p["protocol"],
                "doc": p["doc"],
                "source": p["src"],
                "tests": p["tests"],
                "mutation": score_info,
            }
        )
    for m in BACKEND_MODULES:
        key = Path(m["src"]).name
        cm = backend_data.get(m["src"]) or backend_data.get(key) or {}
        score_info = mutation_score_from_cargo_mutants(cm)
        records.append(
            {
                "protocol": None,
                "doc": None,
                "source": m["src"],
                "tests": m["tests"],
                "mutation": score_info,
            }
        )
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }


def main():
    frontend_json = REPO_ROOT / "frontend" / "reports" / "mutation" / "mutants.json"
    backend_dir = REPO_ROOT / "backend" / "mutants.out"

    frontend_data = load_stryker_json(frontend_json)
    backend_data = load_cargo_mutants_json(backend_dir)

    md = generate_markdown(frontend_data, backend_data)
    js = generate_json(frontend_data, backend_data)

    out_md = REPO_ROOT / "evidence-chain.md"
    out_json = REPO_ROOT / "evidence-chain.json"

    with open(out_md, "w") as f:
        f.write(md)
    with open(out_json, "w") as f:
        json.dump(js, f, indent=2)

    print(f"Wrote {out_md}")
    print(f"Wrote {out_json}")


if __name__ == "__main__":
    main()
