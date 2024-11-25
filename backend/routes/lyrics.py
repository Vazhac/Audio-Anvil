import os
from flask import Blueprint, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")  # Ensure your API key is set
)

# Create a Flask blueprint
lyrics_bp = Blueprint("lyrics", __name__)

@lyrics_bp.route("/", methods=["POST"])
def generate_lyrics():
    """
    Generate lyrics using OpenAI's latest client interface.
    Request body should contain:
    - theme: The theme of the song
    - mood: The mood of the song
    - genre: The genre of the song
    """
    data = request.json
    theme = data.get("theme", "life")
    mood = data.get("mood", "neutral")
    genre = data.get("genre", "general")

    prompt = f"Write a {mood} {genre} song about {theme}."

    try:
        # Call OpenAI API to generate chat completion
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="gpt-4",  # Use 'gpt-3.5-turbo' if gpt-4 is unavailable
        )

        # Extract the generated lyrics from the response object
        lyrics = response.choices[0].message.content.strip()
        return jsonify({"lyrics": lyrics}), 200

    except Exception as e:
        # Handle exceptions and return error response
        return jsonify({"error": str(e)}), 500
