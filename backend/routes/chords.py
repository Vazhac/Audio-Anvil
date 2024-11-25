from flask import Blueprint, request, jsonify

chords_bp = Blueprint("chords", __name__)

@chords_bp.route("/", methods=["POST"])
def suggest_chords():
    data = request.json
    key = data.get("key", "C")
    mood = data.get("mood", "happy")

    progressions = {
        "happy": {
            "C": ["C - G - Am - F", "C - F - G - C"],
            "G": ["G - D - Em - C", "G - C - D - G"]
        },
        "sad": {
            "C": ["Am - F - C - G", "C - G - F - Am"],
            "G": ["Em - C - G - D", "G - D - C - Em"]
        }
    }

    chords = progressions.get(mood, {}).get(key, ["No progressions available"])
    return jsonify({"chords": chords})
