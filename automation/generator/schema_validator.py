"""
Schema validation wrapper.

Calls the Node.js AJV validator to check generated business JSON
against business.schema.json.
"""

import subprocess
from pathlib import Path

VALIDATOR_SCRIPT = Path(__file__).parent / "validate_schema.mjs"
PROJECT_ROOT = Path(__file__).parent.parent.parent


def validate_business_json(json_path: str | Path) -> tuple[bool, str]:
    """
    Validate a business JSON file against the schema.

    Args:
        json_path: Path to the business JSON file

    Returns:
        Tuple of (is_valid, error_message)
    """
    result = subprocess.run(
        ["node", str(VALIDATOR_SCRIPT), str(json_path)],
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
    )

    if result.returncode == 0:
        return True, ""
    else:
        return False, result.stderr.strip()


def validate_all_generated(templates_dir: Path) -> list[tuple[str, bool, str]]:
    """
    Validate all generated business JSON files in templates directory.

    Returns list of (subdomain, is_valid, errors)
    """
    results = []

    for subdir in sorted(templates_dir.iterdir()):
        if not subdir.is_dir():
            continue
        json_file = subdir / f"{subdir.name}.json"
        if not json_file.exists():
            continue

        is_valid, errors = validate_business_json(json_file)
        results.append((subdir.name, is_valid, errors))

        status = "VALID" if is_valid else "INVALID"
        print(f"  [{status}] {subdir.name}")
        if errors:
            print(f"    {errors}")

    return results
