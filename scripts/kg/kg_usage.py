#!/usr/bin/env python3
"""Harness usage ingestion + cache-cost metrics for KG telemetry.

Standalone (no git walk, unlike eval.py):
  ingest  — parse a harness usage feed (Claude Code transcript) -> .kg-state/usage.jsonl
  report  — cache-hit ratio, cost-per-turn, cache-write spikes from those events

eval.py imports cache_metrics() to fold the same numbers into its unified report.
This is the measurement half of KG-MCP-PLAN Phase 2.1, pulled ahead of Phase 1 so
MCP retrieval can be validated against a real prompt-cache-cost baseline (the KG
CLIs only measure retrieval *payload* size, never the model's prompt cache).
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from statistics import median
from typing import Any, Iterable

from kg_common import REPO_ROOT, now_iso

USAGE_PATH = REPO_ROOT / ".kg-state" / "usage.jsonl"

# Cost weights in input-token-equivalent units (model-agnostic; not dollars).
# Anthropic 5-min prompt cache: write 1.25x, read 0.1x base input. Output ~5x.
WEIGHT_INPUT, WEIGHT_CACHE_WRITE, WEIGHT_CACHE_READ, WEIGHT_OUTPUT = 1.0, 1.25, 0.1, 5.0
SPIKE_FACTOR = 5.0  # flag turns whose cost >= factor x median turn cost


@dataclass
class Turn:
    session_id: str
    msg_id: str
    ts: str | None
    model: str | None
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
    is_sidechain: bool

    @property
    def cost(self) -> float:
        return (self.input_tokens * WEIGHT_INPUT
                + self.cache_write_tokens * WEIGHT_CACHE_WRITE
                + self.cache_read_tokens * WEIGHT_CACHE_READ
                + self.output_tokens * WEIGHT_OUTPUT)

    @property
    def prefix_input(self) -> int:  # input-side only; cache-hit denominator basis
        return self.input_tokens + self.cache_read_tokens + self.cache_write_tokens

    @property
    def write_share(self) -> float:
        return (self.cache_write_tokens / self.prefix_input) if self.prefix_input else 0.0


# ---------- ingestion: Claude Code transcript -> normalized usage events ----------

def default_transcript_dir() -> Path:
    """Best-effort Claude Code transcript dir for the current cwd.

    Claude Code stores transcripts at ~/.claude/projects/<slug>, where <slug> is the
    *launch cwd* with '/' -> '-' and a leading '-'. NOTE: the launch cwd is often the
    outer repo, not {PRODUCT_ROOT}; when it differs, pass --transcript-dir explicitly.
    """
    slug = "-" + str(Path.cwd()).lstrip("/").replace("/", "-")
    return Path.home() / ".claude" / "projects" / slug


def parse_claude_transcript(path: Path) -> list[Turn]:
    turns: list[Turn] = []
    seen: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if rec.get("type") != "assistant":
            continue
        message = rec.get("message") or {}
        usage = message.get("usage")
        if not usage:
            continue
        msg_id = message.get("id") or rec.get("uuid") or ""
        if msg_id in seen:        # streaming repeats a message id; dedupe (first wins)
            continue
        seen.add(msg_id)
        turns.append(Turn(
            session_id=rec.get("sessionId") or path.stem,
            msg_id=msg_id,
            ts=rec.get("timestamp"),
            model=message.get("model"),
            input_tokens=int(usage.get("input_tokens", 0) or 0),
            output_tokens=int(usage.get("output_tokens", 0) or 0),
            cache_read_tokens=int(usage.get("cache_read_input_tokens", 0) or 0),
            cache_write_tokens=int(usage.get("cache_creation_input_tokens", 0) or 0),
            is_sidechain=bool(rec.get("isSidechain", False)),
        ))
    return turns


def turn_to_event(turn: Turn) -> dict[str, Any]:
    return {
        "ts": turn.ts or now_iso(), "source": "harness", "harness": "claude-code",
        "session_id": turn.session_id, "msg_id": turn.msg_id, "model": turn.model,
        "is_sidechain": turn.is_sidechain, "tool": "turn",
        "payload": {
            "input_tokens": turn.input_tokens, "output_tokens": turn.output_tokens,
            "cache_read_tokens": turn.cache_read_tokens,
            "cache_write_tokens": turn.cache_write_tokens,
        },
    }


def ingest(transcripts: Iterable[Path], out_path: Path = USAGE_PATH) -> int:
    """Append new turn events to out_path. Idempotent: dedupes by msg_id across runs."""
    existing: set[str] = set()
    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8").splitlines():
            try:
                existing.add(json.loads(line).get("msg_id", ""))
            except json.JSONDecodeError:
                continue
    written = 0
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("a", encoding="utf-8") as fh:
        for path in transcripts:
            for turn in parse_claude_transcript(path):
                if turn.msg_id in existing:
                    continue
                existing.add(turn.msg_id)
                fh.write(json.dumps(turn_to_event(turn), ensure_ascii=False) + "\n")
                written += 1
    return written


# ---------- metrics (importable by eval.py) ----------

def _turn_from_event(event: dict[str, Any]) -> Turn | None:
    if event.get("tool") != "turn":
        return None
    p = event.get("payload") or {}
    return Turn(
        session_id=event.get("session_id", ""), msg_id=event.get("msg_id", ""),
        ts=event.get("ts"), model=event.get("model"),
        input_tokens=int(p.get("input_tokens", 0) or 0),
        output_tokens=int(p.get("output_tokens", 0) or 0),
        cache_read_tokens=int(p.get("cache_read_tokens", 0) or 0),
        cache_write_tokens=int(p.get("cache_write_tokens", 0) or 0),
        is_sidechain=bool(event.get("is_sidechain", False)),
    )


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return ordered[max(0, min(len(ordered) - 1, int(round((len(ordered) - 1) * pct))))]


def cache_metrics(events: list[dict[str, Any]], spike_factor: float = SPIKE_FACTOR) -> dict[str, Any]:
    turns = [t for t in (_turn_from_event(e) for e in events) if t is not None]
    if not turns:
        return {"turns": 0, "cache_hit_ratio": None,
                "cost_per_turn": {"mean": None, "p50": None, "p95": None},
                "cache_write_spikes": []}

    total_read = sum(t.cache_read_tokens for t in turns)
    total_write = sum(t.cache_write_tokens for t in turns)
    total_input = sum(t.input_tokens for t in turns)
    denom = total_read + total_write + total_input
    cache_hit_ratio = (total_read / denom) if denom else None

    costs = [t.cost for t in turns]
    med = median(costs)
    spikes = sorted(
        ({"session_id": t.session_id, "msg_id": t.msg_id, "ts": t.ts,
          "cost": round(t.cost, 1), "x_median": round(t.cost / med, 1) if med else None,
          "write_share": round(t.write_share, 3),
          "cache_write_tokens": t.cache_write_tokens, "is_sidechain": t.is_sidechain}
         for t in turns if med and t.cost >= spike_factor * med),
        key=lambda s: s["cost"], reverse=True,
    )
    return {
        "turns": len(turns),
        "cache_hit_ratio": round(cache_hit_ratio, 4) if cache_hit_ratio is not None else None,
        "cost_per_turn": {"mean": round(sum(costs) / len(costs), 1),
                          "p50": round(med, 1), "p95": round(percentile(costs, 0.95), 1)},
        "cost_unit": "input-token-equivalents",
        "weights": {"input": WEIGHT_INPUT, "cache_write": WEIGHT_CACHE_WRITE,
                    "cache_read": WEIGHT_CACHE_READ, "output": WEIGHT_OUTPUT},
        "cache_write_spikes": spikes,
    }


def _load_usage_events(path: Path = USAGE_PATH) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def main() -> int:
    ap = argparse.ArgumentParser(description="KG harness-usage ingestion + cache metrics.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    ing = sub.add_parser("ingest", help="Parse harness transcripts into .kg-state/usage.jsonl")
    ing.add_argument("--transcript", action="append", default=[], help="Transcript .jsonl (repeatable).")
    ing.add_argument("--transcript-dir", default=None, help="Dir of *.jsonl (default: Claude Code project dir for cwd).")
    rep = sub.add_parser("report", help="Print cache metrics from .kg-state/usage.jsonl")
    rep.add_argument("--json", action="store_true")
    rep.add_argument("--spike-factor", type=float, default=SPIKE_FACTOR)
    args = ap.parse_args()

    if args.cmd == "ingest":
        paths = [Path(p) for p in args.transcript]
        if not paths:
            d = Path(args.transcript_dir) if args.transcript_dir else default_transcript_dir()
            paths = sorted(d.glob("*.jsonl")) if d.is_dir() else []
        if not paths:
            print("no transcripts found — pass --transcript/--transcript-dir "
                  "(the Claude Code project dir is derived from launch cwd, which may "
                  "differ from PRODUCT_ROOT)", flush=True)
            return 1
        print(f"ingested {ingest(paths)} new turn event(s) -> {USAGE_PATH}")
        return 0

    m = cache_metrics(_load_usage_events(), spike_factor=args.spike_factor)
    if args.json:
        json.dump(m, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    print(f"turns={m['turns']}  cache_hit_ratio={m['cache_hit_ratio']}  "
          f"cost/turn mean={m['cost_per_turn']['mean']} p95={m['cost_per_turn']['p95']} "
          f"({m.get('cost_unit', 'input-token-equivalents')})")
    for s in m["cache_write_spikes"]:
        print(f"  SPIKE {s['x_median']}x median  cost={s['cost']}  "
              f"write_share={s['write_share']}  sidechain={s['is_sidechain']}  {s['ts']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
