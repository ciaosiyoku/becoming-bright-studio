"""Sets the teach example of every question-bank skill (src/skills/*.json, kind "bank") to its first question.

The example must hold exactly the values the app makes for question 0 (src/skills/bank.ts, bankValues), so the
first question is the teach card and is not asked again straight away. Run after adding or editing a bank:
    python scripts/bank-example.py
"""
import glob, json, os

ROOT = os.path.join(os.path.dirname(__file__), "..", "src", "skills")
for path in sorted(glob.glob(os.path.join(ROOT, "*.json"))):
    with open(path, encoding="utf-8") as f:
        skill = json.load(f)
    if skill.get("kind") != "bank":
        continue
    example = {"i": 0}
    for lang, questions in skill["params"]["bank"].items():
        q = questions[0]
        example[f"q_{lang}"] = q[0]
        example[f"answer_{lang}"] = q[1]
        example[f"why_{lang}"] = q[4]
    if skill.get("example") != example:
        skill["example"] = example
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(skill, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("example set:", skill["id"])
