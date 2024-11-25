from flask import Blueprint, request, jsonify
from firebase import db  # Import Firestore client
from firebase_admin import firestore  # Import Firestore for constants like SERVER_TIMESTAMP

# Create a Flask Blueprint for the drafts API
drafts_bp = Blueprint("drafts", __name__)

# Route: Save a draft (POST)
@drafts_bp.route("/", methods=["POST"])
def save_draft():
    """
    Save a draft to the Firestore database.
    Request body should contain:
    - title: Title of the draft (default: "Untitled")
    - lyrics: Lyrics of the draft
    - chords: List of chord progressions
    """
    data = request.json  # Parse the incoming JSON request body
    title = data.get("title", "Untitled")
    lyrics = data.get("lyrics", "")
    chords = data.get("chords", [])

    try:
        # Create a new document in the "drafts" collection
        doc_ref = db.collection("drafts").add({
            "title": title,
            "lyrics": lyrics,
            "chords": chords,
            "timestamp": firestore.SERVER_TIMESTAMP  # Automatically set the timestamp
        })
        return jsonify({"message": "Draft saved successfully!", "id": doc_ref[1].id}), 201
    except Exception as e:
        # Handle any errors and return a 500 response
        return jsonify({"error": str(e)}), 500

# Route: Retrieve all drafts (GET)
@drafts_bp.route("/", methods=["GET"])
def get_drafts():
    """
    Retrieve all drafts from the Firestore database.
    Returns a list of drafts, each with:
    - id: Firestore document ID
    - title: Title of the draft
    - lyrics: Lyrics of the draft
    - chords: List of chord progressions
    - timestamp: Timestamp when the draft was saved
    """
    try:
        # Query all documents in the "drafts" collection
        drafts = db.collection("drafts").stream()

        # Convert Firestore documents to a list of dictionaries
        draft_list = [
            {"id": doc.id, **doc.to_dict()} for doc in drafts
        ]
        return jsonify(draft_list), 200
    except Exception as e:
        # Handle any errors and return a 500 response
        return jsonify({"error": str(e)}), 500
