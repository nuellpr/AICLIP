#!/usr/bin/env python3
"""
Persistent Whisper service — load base model once, transcribe many files via stdin.
Protocol: Node writes audio path per line -> Python prints JSON per line (or {"error": "..."})
Keeps best accuracy (base) + fastest (no reload per clip).
"""
import sys, json, os
try:
    import whisper
except ImportError:
    print(json.dumps({"error": "whisper not installed"}), flush=True)
    sys.exit(1)

IND_PROMPT = "Transkripsi bahasa Indonesia resmi dan akurat dengan ejaan baku. Kata-kata: uangnya, uang, sudah, tidak, bagaimana, seperti, kalau, memakai, hanya, dapat."

# ponytail: load once at startup, reuse for all clips — saves ~15-20s per clip vs per-clip load_model
print("LOADING base model...", file=sys.stderr, flush=True)
try:
    model = whisper.load_model("base")
    print("READY", flush=True)
    print("Whisper base READY", file=sys.stderr, flush=True)
except Exception as e:
    print(json.dumps({"error": f"load_model failed: {e}"}), flush=True)
    sys.exit(1)

for raw in sys.stdin:
    path = raw.strip()
    if not path:
        continue
    if path == "EXIT":
        break
    try:
        # verify file exists
        if not os.path.exists(path):
            print(json.dumps({"error": f"file not found: {path}"}), flush=True)
            continue
        r = model.transcribe(path, word_timestamps=True, fp16=False, verbose=False, initial_prompt=IND_PROMPT)
        words = []
        for s in r.get("segments", []):
            for w in s.get("words", []):
                words.append({"text": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)})
        print(json.dumps({"text": r.get("text", ""), "words": words}), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
