# worker/app/main.py
from __future__ import annotations

import argparse
import sys

from .config import load_config


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="app.main")
    sub = parser.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("collect")
    c.add_argument("--force", action="store_true", help="ignore the interval guard")
    c.add_argument("--trigger", default="schedule")
    for name in ("monitor", "retention", "linkcheck", "usage"):
        sub.add_parser(name)
    args = parser.parse_args(argv)
    cfg = load_config()

    # imports are lazy so each command works as soon as its module exists
    if args.cmd == "collect":
        from .pipeline import run_collection
        return run_collection(cfg, trigger=args.trigger, force=args.force)
    if args.cmd == "monitor":
        from .monitor import run_monitor
        return run_monitor(cfg)
    if args.cmd == "retention":
        from .retention import run_retention
        return run_retention(cfg)
    if args.cmd == "linkcheck":
        from .linkcheck import run_linkcheck
        return run_linkcheck(cfg)
    if args.cmd == "usage":
        from .monitor import print_usage
        return print_usage(cfg)
    return 2


if __name__ == "__main__":
    sys.exit(main())