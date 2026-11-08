#!/usr/bin/env python3
"""Sync the Project Abyss roadmap on the portfolio from the project's Plan.md.

Usage: python3 tools/sync_abyss.py path/to/Plan.md
Reads milestones (## Mx — Name (N h)) and their tasks (- [ ] / - [x] **x.y — Title**),
then rewrites the "milestones" block of data/abyss.json. Devlog entries are kept as they are.
"""
import json, re, sys, datetime, pathlib

plan = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
out = pathlib.Path(__file__).resolve().parent.parent / "data" / "abyss.json"
data = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {"devlog": []}

milestones, cur = [], None
for line in plan.splitlines():
    m = re.match(r"^##\s+(M\d+|Bonus)\s*[—-]?\s*(.*?)\s*(?:\((\d+)\s*h[^)]*\))?\s*$", line)
    if m:
        name = m.group(2).strip()
        if m.group(1) == "Bonus" or name.startswith("("): name = m.group(1)
        cur = {"id": m.group(1), "name": name, "hours": int(m.group(3)) if m.group(3) else None, "tasks": []}
        milestones.append(cur)
        continue
    t = re.match(r"^- \[( |x|X)\]\s+\*\*([\w.]+)\s*[—-]\s*(.*?)\*\*", line)
    if t and cur is not None:
        cur["tasks"].append({"id": t.group(2), "title": t.group(3).strip(), "done": t.group(1).lower() == "x"})

data["milestones"] = [m for m in milestones if m["tasks"]]
data["synced"] = datetime.date.today().isoformat()
out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
done = sum(t["done"] for m in data["milestones"] for t in m["tasks"])
total = sum(len(m["tasks"]) for m in data["milestones"])
print(f"{len(data['milestones'])} milestones · {done}/{total} tasks done → {out}")
