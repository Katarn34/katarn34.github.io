#!/usr/bin/env python3
"""Build the French version of the site in /fr/ from the English pages.

    python3 tools/build_fr.py            # build fr/ and report missing translations
    python3 tools/build_fr.py --list     # also write tools/i18n/missing.json

How it works
- Every element that directly holds text is one translation unit: its inner HTML
  (whitespace collapsed) is the key in tools/i18n/fr.json, the value is the French HTML.
- Attributes alt, title, aria-label, placeholder, data-caption and <meta content> too.
- A missing key stays in English and is reported, so the site never breaks.
- Resource paths (assets/, css/, js/, data/) get one more "../"; links between
  pages stay relative and therefore stay inside /fr/.
"""
import json, re, sys, pathlib
from bs4 import BeautifulSoup, NavigableString, Comment, Tag

ROOT = pathlib.Path(__file__).resolve().parent.parent
DICT = ROOT / "tools" / "i18n" / "fr.json"
PAGES = ["", "projects/", "klappen/", "klappen/building/", "wolfpeak/", "flying-ai/", "abyss/"]
SKIP = {"script", "style", "pre", "code", "noscript"}
ATTRS = ["alt", "title", "aria-label", "placeholder", "data-caption"]
RES = re.compile(r"^((?:\.\./)*)(assets|css|js|data)/")

fr = {}
for f in sorted((ROOT / "tools" / "i18n").glob("fr*.json")):
    fr.update(json.loads(f.read_text(encoding="utf-8")))
missing, used = {}, set()

def norm(s):
    return " ".join(s.split())

def tr(key, page):
    key = norm(key)
    if not key or not re.search(r"[A-Za-z]", key):
        return None
    if key in fr:
        used.add(key)
        return fr[key]
    v = pattern(key, page)
    if v is not None:
        return v
    missing.setdefault(key, page)
    return None

def pattern(key, page):
    """Repeated shapes translated from one caption entry (Blueprint galleries)."""
    m = re.match(r"^Enlarge graph (\d+): (.*)$", key)
    if m:
        c = tr(m.group(2), page)
        return f"Agrandir le graphe {m.group(1)} : {c}" if c is not None else None
    m = re.match(r'^(<span class="bp__n">\d+</span>)(.*)$', key)
    if m:
        c = tr(m.group(2), page)
        return m.group(1) + c if c is not None else None
    m = re.match(r"^(\d+) graphs?$", key)
    if m:
        return f"{m.group(1)} graphe" + ("s" if m.group(1) != "1" else "")
    return None

def has_direct_text(el):
    return any(isinstance(c, NavigableString) and not isinstance(c, Comment) and c.strip() for c in el.children)

def walk(el, page):
    for child in list(el.children):
        if not isinstance(child, Tag) or child.name in SKIP:
            continue
        for a in ATTRS:
            if child.has_attr(a):
                v = tr(child[a], page)
                if v is not None:
                    child[a] = v
        if child.has_attr("data-lang-switch"):
            continue
        if child.name == "dialog" or child.has_attr("data-no-i18n"):
            walk(child, page) if child.name == "dialog" else None
            continue
        if has_direct_text(child):
            v = tr(child.decode_contents(), page)
            if v is not None:
                child.clear()
                child.append(BeautifulSoup(v, "html.parser"))
        else:
            walk(child, page)

def build(page):
    src = ROOT / page / "index.html"
    soup = BeautifulSoup(src.read_text(encoding="utf-8"), "html.parser")
    depth = page.count("/")
    soup.html["lang"] = "fr"
    # translatable head bits
    t = soup.title
    if t and tr(t.string or "", page):
        t.string = fr[norm(t.string)]
    for m in soup.find_all("meta", attrs={"content": True}):
        if m.get("name") == "description" or m.get("property") in ("og:title", "og:description"):
            v = tr(m["content"], page)
            if v is not None:
                m["content"] = v
    # resource paths
    for el in soup.find_all(True):
        for a in ("href", "src", "poster", "data-full"):
            if el.has_attr(a) and RES.match(el[a]):
                el[a] = "../" + el[a]
        if el.has_attr("data-base"):
            el["data-base"] = "../" + el["data-base"]
    # French CV
    for a in soup.select('a[download]'):
        if "CV%20(EN)" in a.get("href", ""):
            a["href"] = a["href"].replace("CV%20(EN)", "CV%20(FR)")
            a["download"] = "CV (FR) - Technical Designer - Esteban Lafargue.pdf"
    # language switch: FR page points back to the English page
    for a in soup.select("a[data-lang-switch]"):
        a["href"] = "../" * (depth + 1) + page
        a["hreflang"] = "en"; a["lang"] = "en"
        a["aria-label"] = "English version"
        a.string = "EN"
    walk(soup.body, page)
    out = ROOT / "fr" / page / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(str(soup), encoding="utf-8")

for p in PAGES:
    build(p)

print(f"Built {len(PAGES)} French pages · {len(used)} units translated · {len(missing)} missing")
if "--list" in sys.argv or missing:
    (ROOT / "tools" / "i18n" / "missing.json").write_text(json.dumps(missing, ensure_ascii=False, indent=1), encoding="utf-8")
unused = set(fr) - used
if unused:
    print(f"{len(unused)} unused keys in fr.json (text changed or removed in English)")
