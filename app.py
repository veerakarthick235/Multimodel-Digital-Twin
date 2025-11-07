#!/usr/bin/env python3
import os, json, uuid, datetime, re
from collections import Counter
from math import sqrt
from typing import List, Dict, Any
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from providers.llm_provider import generate_reply

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")
VOICE_DIR = os.path.join(APP_DIR, "voice_samples")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(VOICE_DIR, exist_ok=True)

MEMORY_PATH = os.path.join(DATA_DIR, "memory.json")
PREFS_PATH = os.path.join(DATA_DIR, "preferences.json")

def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def save_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)

def tokenize(text: str) -> List[str]:
    text = text.lower()
    # basic tokenization (remove non-letters, keep numbers)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    toks = [t for t in text.split() if t]
    return toks

def vectorize(text: str) -> Dict[str, float]:
    # Simple normalized term-frequency vector
    toks = tokenize(text)
    c = Counter(toks)
    if not c:
        return {}
    norm = sqrt(sum(v*v for v in c.values()))
    return {k: v / norm for k, v in c.items()} if norm else dict(c)

def cosine_sim(v1: Dict[str, float], v2: Dict[str, float]) -> float:
    if not v1 or not v2:
        return 0.0
    common = set(v1).intersection(v2)
    dot = sum(v1[k]*v2[k] for k in common)
    # vectors are normalized already
    return float(dot)

def ensure_store():
    mem = load_json(MEMORY_PATH, {"items":[]})
    prefs = load_json(PREFS_PATH, {"tone":"professional","encouraging":True,"domain":"general"})
    return mem, prefs

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

@app.route("/")
def index():
    mem, prefs = ensure_store()
    return render_template("index.html", items=mem["items"], prefs=prefs)

@app.post("/api/ingest/text")
def ingest_text():
    data = request.get_json(force=True)
    kind = data.get("kind", "message")  
    content = (data.get("content") or "").strip()
    meta = data.get("meta", {})

    if not content:
        return jsonify({"ok": False, "error":"Empty content"}), 400

    mem, _ = ensure_store()
    item_id = str(uuid.uuid4())
    vec = vectorize(content)

    mem["items"].append({
        "id": item_id,
        "kind": kind,
        "content": content,
        "vector": vec,
        "meta": meta,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    })
    save_json(MEMORY_PATH, mem)
    return jsonify({"ok": True, "id": item_id})

@app.post("/api/ingest/voice")
def ingest_voice():
    if "file" not in request.files:
        return jsonify({"ok": False, "error":"No file"}), 400
    f = request.files["file"]
    ext = os.path.splitext(f.filename)[1].lower() or ".webm"
    file_id = str(uuid.uuid4()) + ext
    path = os.path.join(VOICE_DIR, file_id)
    f.save(path)

    # In a real system: create a voice embedding and store ref in memory.
    mem, _ = ensure_store()
    mem["items"].append({
        "id": str(uuid.uuid4()),
        "kind": "voice",
        "content": f"voice:{file_id}",
        "vector": {},  
        "meta": {"filename": file_id},
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    })
    save_json(MEMORY_PATH, mem)
    return jsonify({"ok": True, "file": file_id})

@app.get("/api/memory/search")
def memory_search():
    q = request.args.get("q", "").strip()
    k = int(request.args.get("k", "5"))
    mem, _ = ensure_store()
    if not q:
        return jsonify({"ok": True, "results": mem["items"][:k]})

    qv = vectorize(q)
    scored = []
    for it in mem["items"]:
        s = cosine_sim(qv, it.get("vector", {}))
        scored.append((s, it))
    scored.sort(key=lambda x: x[0], reverse=True)
    results = [dict(score=float(s), **it) for s, it in scored[:k]]
    return jsonify({"ok": True, "results": results})

@app.post("/api/preferences")
def save_prefs():
    data = request.get_json(force=True)
    prefs = load_json(PREFS_PATH, {})
    prefs.update({
        "tone": data.get("tone", prefs.get("tone","professional")),
        "encouraging": bool(data.get("encouraging", prefs.get("encouraging", True))),
        "domain": data.get("domain", prefs.get("domain","general"))
    })
    save_json(PREFS_PATH, prefs)
    return jsonify({"ok": True, "prefs": prefs})

@app.post("/api/chat")
def chat():
    data = request.get_json(force=True)
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"ok": False, "error":"Empty prompt"}), 400

    mem, prefs = ensure_store()

    # Retrieve top-k relevant textual memories
    qv = vectorize(prompt)
    textual = [it for it in mem["items"] if it["kind"] in ("message","note","task","preference")]
    for it in textual:
        it["_score"] = cosine_sim(qv, it.get("vector", {}))
    textual.sort(key=lambda x: x["_score"], reverse=True)
    top = [t["content"] for t in textual[:3]]

    reply = generate_reply(prompt, top, prefs)
    return jsonify({"ok": True, "reply": reply, "context": top})

@app.get("/download/<path:filename>")
def download(filename):
    return send_from_directory(".", filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
