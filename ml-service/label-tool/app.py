"""
app.py - Image Labeling Tool
Run: pip install flask  then  python app.py
Open: http://localhost:5050
"""

import json, shutil
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_file, abort

SOURCE_DIR    = Path(r"C:\Users\user\Downloads\archive\css-data\train\images")
DEST_ROOT     = Path(r"C:\Users\user\Downloads\chantier_progress_dataset\train")
PROGRESS_FILE = Path(__file__).parent / "progress.json"
CLASSES = ["terrassement", "fondation", "structure", "second_oeuvre", "finition"]
IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

app = Flask(__name__)
state = {"queue": [], "labeled": {}, "skipped": [], "history": [], "total": 0}


def load_state():
    all_imgs = sorted(f.name for f in SOURCE_DIR.iterdir() if f.suffix.lower() in IMG_EXTS)
    state["total"] = len(all_imgs)
    if PROGRESS_FILE.exists():
        saved = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
        state["labeled"] = saved.get("labeled", {})
        state["skipped"]  = saved.get("skipped", [])
        state["history"]  = saved.get("history", [])
    done = set(state["labeled"]) | set(state["skipped"])
    state["queue"] = [img for img in all_imgs if img not in done]
    print(f"[LabelTool] {len(state['queue'])} images remaining / {state['total']} total")


def save_state():
    PROGRESS_FILE.write_text(json.dumps({
        "labeled": state["labeled"],
        "skipped":  state["skipped"],
        "history":  state["history"][-100:],
    }, indent=2), encoding="utf-8")


def cur(): return state["queue"][0] if state["queue"] else None


@app.route("/")
def index(): return render_template("index.html", classes=CLASSES)


@app.route("/api/status")
def api_status():
    fname = cur()
    n_labeled  = len(state["labeled"])
    n_skipped  = len(state["skipped"])
    if fname is None:
        return jsonify({"done": True, "labeled": n_labeled, "skipped": n_skipped, "total": state["total"]})
    return jsonify({
        "done": False, "filename": fname,
        "position": n_labeled + n_skipped + 1,
        "total": state["total"], "remaining": len(state["queue"]),
        "labeled": n_labeled, "skipped": n_skipped,
        "can_undo": bool(state["history"]),
    })


@app.route("/api/image")
def api_image():
    fname = cur()
    if not fname: abort(404)
    p = SOURCE_DIR / fname
    if not p.exists(): abort(404)
    return send_file(p)


@app.route("/api/label", methods=["POST"])
def api_label():
    phase = (request.get_json(force=True) or {}).get("phase", "")
    if phase not in CLASSES: return jsonify({"error": "Invalid phase"}), 400
    fname = cur()
    if not fname: return jsonify({"error": "Queue empty"}), 404
    dst_dir = DEST_ROOT / phase
    dst_dir.mkdir(parents=True, exist_ok=True)
    try: shutil.move(str(SOURCE_DIR / fname), str(dst_dir / fname))
    except Exception as e: return jsonify({"error": str(e)}), 500
    state["labeled"][fname] = phase
    state["history"].append({"filename": fname, "phase": phase})
    state["queue"].pop(0)
    save_state()
    return jsonify({"ok": True})


@app.route("/api/skip", methods=["POST"])
def api_skip():
    fname = cur()
    if not fname: return jsonify({"error": "Queue empty"}), 404
    state["skipped"].append(fname)
    state["queue"].pop(0)
    save_state()
    return jsonify({"ok": True})


@app.route("/api/undo", methods=["POST"])
def api_undo():
    if not state["history"]: return jsonify({"error": "Nothing to undo"}), 400
    last = state["history"].pop()
    src = DEST_ROOT / last["phase"] / last["filename"]
    if not src.exists(): return jsonify({"error": "File missing from destination"}), 404
    try: shutil.move(str(src), str(SOURCE_DIR / last["filename"]))
    except Exception as e: return jsonify({"error": str(e)}), 500
    state["labeled"].pop(last["filename"], None)
    state["queue"].insert(0, last["filename"])
    save_state()
    return jsonify({"ok": True, "restored": last["filename"]})


@app.route("/api/stats")
def api_stats():
    breakdown = {c: 0 for c in CLASSES}
    for phase in state["labeled"].values():
        if phase in breakdown: breakdown[phase] += 1
    return jsonify({"breakdown": breakdown, "labeled": len(state["labeled"]),
                    "skipped": len(state["skipped"]), "remaining": len(state["queue"])})


if __name__ == "__main__":
    if not SOURCE_DIR.exists():
        print(f"ERROR: Source not found: {SOURCE_DIR}"); exit(1)
    DEST_ROOT.mkdir(parents=True, exist_ok=True)
    load_state()
    print("[LabelTool] Open http://localhost:5050")
    app.run(debug=False, port=5050)
