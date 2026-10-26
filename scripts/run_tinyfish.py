#!/usr/bin/env python3
"""TinyFish Web Agent CLI Runner Script.

Usage:
  python3 scripts/run_tinyfish.py "Calculate META's debt to equity ratio using figures from its 2025 fiscal year 10-K filing from https://www.sec.gov" --url "https://www.sec.gov" --pretty

Or with named arguments:
  python3 scripts/run_tinyfish.py --goal "..." --url "https://www.sec.gov" --pretty
"""
import sys
import os
import argparse
import asyncio
import json
from pathlib import Path

# Add backend directory to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

from app.services.tinyfish_service import TinyFishService


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Run TinyFish Autonomous Web Agent directly from command line."
    )
    # Allow goal as positional or flag
    parser.add_argument(
        "positional_goal",
        nargs="?",
        default=None,
        help="Natural language task or goal for the web agent.",
    )
    parser.add_argument(
        "--goal",
        dest="flag_goal",
        default=None,
        help="Natural language task or goal for the web agent.",
    )
    parser.add_argument(
        "--url",
        required=True,
        help="Target web URL to navigate and extract data from.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        default=True,
        help="Format output into clear readable Markdown / JSON (default: True).",
    )
    parser.add_argument(
        "--raw-json",
        action="store_true",
        help="Print raw JSON response instead of Markdown report.",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Optional TinyFish API Key (defaults to TINYFISH_API_KEY environment variable).",
    )
    return parser.parse_args()


async def main():
    args = parse_arguments()
    goal = args.positional_goal or args.flag_goal
    if not goal:
        print("Error: You must provide a goal for the web agent.", file=sys.stderr)
        sys.exit(1)

    url = args.url
    api_key = args.api_key or os.getenv("TINYFISH_API_KEY")

    service = TinyFishService(api_key=api_key)
    status_info = service.get_status()

    print(f"🐟 TinyFish Web Agent Runner")
    print("-" * 60)
    print(f"Target URL: {url}")
    print(f"Goal:       {goal}")
    print(f"Mode:       {status_info['provider']} ({'Live API Key Active' if status_info['configured'] else 'Deterministic Simulation / SEC Calculator'})")
    print("-" * 60)
    print("⏳ Executing web agent workflow...\n")

    result = await service.run_agent(goal=goal, url=url, pretty=args.pretty)

    if args.raw_json:
        print(json.dumps(result, indent=2))
        return

    print(result.get("formatted_output", ""))
    print("\n" + "-" * 60)
    print(f"⏱️  Execution completed in {result.get('execution_time_seconds', 0)} seconds.")
    print(f"🆔 Run ID: {result.get('run_id')}")
    if result.get("simulated"):
        print("💡 Tip: To run live headless Chrome navigation on remote sites, set TINYFISH_API_KEY in your environment.")


if __name__ == "__main__":
    asyncio.run(main())
