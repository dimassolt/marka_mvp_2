"""Refresh data/first_names.txt from SSB table 10501 (first names with 200+ bearers).

Run from engine/: uv run python scripts/fetch_first_names.py
This is the only engine code that uses the network, and it only runs by hand.
"""

import json
import urllib.request
from pathlib import Path

URL = "https://data.ssb.no/api/v0/no/table/10501"
OUT = Path(__file__).parent.parent / "src" / "ghost_engine" / "data" / "first_names.txt"
SKIP = {"Md"}  # an abbreviation in the source, not a first name


def main() -> None:
    with urllib.request.urlopen(URL, timeout=30) as response:
        meta = json.load(response)
    variable = next(v for v in meta["variables"] if v["code"] == "Fornavn")
    names = sorted(
        {
            name
            for name in variable["valueTexts"]
            if len(name) >= 2 and name.replace("-", "").isalpha() and name not in SKIP
        }
    )
    header = (
        "# First names from SSB, table 10501 (girls' and boys' names with 200+ bearers).\n"
        f"# Source: {URL}\n"
        "# Regenerate with scripts/fetch_first_names.py. Do not edit by hand;\n"
        "# put exceptions in first_name_stoplist.txt.\n"
    )
    OUT.write_text(header + "\n".join(names) + "\n", encoding="utf-8")
    print(f"{len(names)} names -> {OUT}")


if __name__ == "__main__":
    main()
